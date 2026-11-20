<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseService
{
    public function __construct(protected PurchaseRepositoryInterface $purchases) {}

    public function list(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        return $this->purchases->paginatePurchases($perPage, $search, $dateFrom, $dateTo);
    }

    public function get(int $id): Purchase
    {
        return $this->purchases->findOrFail($id, ['*'], ['supplier', 'shop', 'paymentType', 'creator', 'approver', 'items.product']);
    }

    public function generatePurchaseNo(?string $shopCode = null): string
    {
        $prefix = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $shopCode ?? 'HQ')).now()->format('ymd');

        do {
            $purchaseNo = 'PUR-'.$prefix.'-'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while ($this->purchases->numberExists($purchaseNo));

        return $purchaseNo;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Purchase
    {
        $items = collect($data['items']);
        $products = Product::query()->whereIn('id', $items->pluck('product_id')->all())->get()->keyBy('id');

        if ($products->count() !== $items->pluck('product_id')->unique()->count()) {
            throw ValidationException::withMessages(['items' => 'One or more products are not available for this shop.']);
        }

        $preparedItems = $items->map(function (array $item) use ($products): array {
            $product = $products->get($item['product_id']);
            $quantity = (int) $item['quantity'];
            $unitCost = (float) $item['unit_cost'];
            $discount = round((float) ($item['discount'] ?? 0), 2);
            $vatRate = (float) ($item['vat_rate'] ?? 0);
            $net = max(($quantity * $unitCost) - $discount, 0);
            $vat = round($net * ($vatRate / 100), 2);

            return [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'vat_rate' => $vatRate,
                'discount' => $discount,
                'vat' => $vat,
                'line_total' => round($net + $vat, 2),
            ];
        });

        $subtotal = round($preparedItems->sum(fn (array $item): float => $item['quantity'] * $item['unit_cost']), 2);
        $discount = round($preparedItems->sum('discount'), 2);
        $vat = round($preparedItems->sum('vat'), 2);
        $total = round($subtotal - $discount + $vat, 2);
        $paidAmount = round((float) ($data['paid_amount'] ?? 0), 2);

        if (empty($data['purchase_no']) || $this->purchases->numberExists($data['purchase_no'])) {
            $data['purchase_no'] = $this->generatePurchaseNo($data['shop_code'] ?? null);
        }

        unset($data['items'], $data['shop_code']);

        return DB::transaction(function () use ($data, $preparedItems, $subtotal, $discount, $vat, $total, $paidAmount): Purchase {
            $purchase = $this->purchases->create([
                ...$data,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'vat' => $vat,
                'total' => $total,
                'paid_amount' => $paidAmount,
                'due_amount' => round(max($total - $paidAmount, 0), 2),
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
            ]);

            foreach ($preparedItems as $item) {
                $itemData = $item;
                unset($itemData['vat']);

                $purchase->items()->create($itemData);
            }

            return $purchase->load(['supplier', 'shop', 'paymentType', 'creator', 'approver', 'items.product']);
        });
    }

    public function approve(int $id, int $approverId): Purchase
    {
        return DB::transaction(function () use ($id, $approverId): Purchase {
            $purchase = $this->purchases->findOrFail($id, ['*'], ['items']);

            if ($purchase->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'This purchase order has already been approved.']);
            }

            foreach ($purchase->items as $item) {
                if ($item->product_id) {
                    Product::query()->whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            }

            $purchase->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
            ]);

            return $purchase->load(['supplier', 'shop', 'paymentType', 'creator', 'approver', 'items.product']);
        });
    }
}
