<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Repositories\Contracts\SaleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(protected SaleRepositoryInterface $sales) {}

    public function list(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        return $this->sales->paginateSales($perPage, $search, $dateFrom, $dateTo);
    }

    public function get(int $id): Sale
    {
        return $this->sales->findOrFail($id, ['*'], ['customer', 'shop', 'paymentType', 'creator', 'items.product']);
    }

    public function generateSaleNo(?string $shopCode = null): string
    {
        $prefix = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $shopCode ?? 'HQ')).now()->format('ymd');

        do {
            $saleNo = 'SAL-'.$prefix.'-'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while ($this->sales->numberExists($saleNo));

        return $saleNo;
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): Sale
    {
        return DB::transaction(function () use ($data): Sale {
            $items = collect($data['items']);
            $products = Product::query()
                ->whereIn('id', $items->pluck('product_id')->all())
                ->when($data['shop_id'] ?? null, fn ($query, int $shopId) => $query->where('created_by_shop_id', $shopId))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== $items->pluck('product_id')->unique()->count()) {
                throw ValidationException::withMessages(['items' => 'One or more products are not available for this shop.']);
            }

            $preparedItems = $items->map(function (array $item) use ($products): array {
                $product = $products->get($item['product_id']);
                $quantity = (int) $item['quantity'];

                if ((int) $product->stock < $quantity) {
                    throw ValidationException::withMessages(['items' => "Insufficient stock for {$product->name}."]);
                }

                $unitPrice = (float) $item['unit_price'];
                $discount = round((float) ($item['discount'] ?? 0), 2);
                $vatRate = (float) ($item['vat_rate'] ?? 0);
                $net = round(max(($quantity * $unitPrice) - $discount, 0), 2);
                $vat = round($net - ($net / (1 + ($vatRate / 100))), 2);

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'vat_rate' => $vatRate,
                    'discount' => $discount,
                    'vat' => $vat,
                    'line_total' => $net,
                ];
            });

            $subtotal = round($preparedItems->sum(fn (array $item): float => $item['quantity'] * $item['unit_price']), 2);
            $discount = round($preparedItems->sum('discount'), 2);
            $vat = round($preparedItems->sum('vat'), 2);
            $total = round($subtotal - $discount, 2);
            $paidAmount = round((float) ($data['paid_amount'] ?? 0), 2);

            if (empty($data['sale_no']) || $this->sales->numberExists($data['sale_no'])) {
                $data['sale_no'] = $this->generateSaleNo($data['shop_code'] ?? null);
            }

            unset($data['items'], $data['shop_code']);

            $sale = $this->sales->create([
                ...$data,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'vat' => $vat,
                'total' => $total,
                'paid_amount' => $paidAmount,
                'due_amount' => round(max($total - $paidAmount, 0), 2),
                'status' => 'completed',
                'refund_amount' => 0,
                'returned_at' => null,
                'return_reason' => null,
            ]);

            foreach ($preparedItems as $item) {
                $itemData = $item;
                unset($itemData['vat']);

                $sale->items()->create($itemData);

                $decremented = Product::query()
                    ->whereKey($item['product_id'])
                    ->where('stock', '>=', $item['quantity'])
                    ->decrement('stock', $item['quantity']);

                if ($decremented === 0) {
                    throw ValidationException::withMessages(['items' => 'Stock changed while saving this sale. Please try again.']);
                }
            }

            return $sale->load(['customer', 'shop', 'paymentType', 'creator', 'items.product']);
        });
    }

    /** @param array<string, mixed> $data */
    public function return(int $id, array $data = []): Sale
    {
        return DB::transaction(function () use ($id, $data): Sale {
            $sale = Sale::query()->whereKey($id)->lockForUpdate()->with('items')->firstOrFail();

            if ($sale->status === 'returned') {
                throw ValidationException::withMessages(['status' => 'This sale has already been returned.']);
            }

            foreach ($sale->items as $item) {
                if ($item->product_id) {
                    Product::query()->whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            }

            $sale->update([
                'status' => 'returned',
                'returned_at' => now(),
                'return_reason' => $data['return_reason'] ?? null,
                'refund_amount' => $sale->total,
            ]);

            return $sale->load(['customer', 'shop', 'paymentType', 'creator', 'items.product']);
        });
    }
}
