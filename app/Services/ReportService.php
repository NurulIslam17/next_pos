<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReportService
{
    public function stocks(array $filters): array
    {
        $query = $this->stocksQuery($filters);

        $summary = [
            'total_products' => (clone $query)->count(),
            'in_stock_products' => (clone $query)->where('products.stock', '>', 0)->count(),
            'out_of_stock_products' => (clone $query)->where('products.stock', '<=', 0)->count(),
            'low_stock_products' => (clone $query)
                ->where('products.stock', '>', 0)
                ->where('products.stock_alert', '>', 0)
                ->whereColumn('products.stock', '<=', 'products.stock_alert')
                ->count(),
            'total_items_in_stock' => (int) ((clone $query)->sum('products.stock') ?: 0),
            'total_stock_value' => (float) ((clone $query)->toBase()->sum(DB::raw('products.stock * products.cost_price')) ?: 0),
        ];

        $paginator = (clone $query)
            ->orderBy('products.name')
            ->orderBy('products.id')
            ->paginate($this->perPage($filters));

        return ['paginator' => $paginator, 'summary' => $summary];
    }

    public function purchases(array $filters): array
    {
        $query = $this->purchasesQuery($filters);

        $summary = [
            'total_purchases' => (clone $query)->count(),
            'pending_purchases' => (clone $query)->where('purchases.status', 'pending')->count(),
            'approved_purchases' => (clone $query)->where('purchases.status', 'approved')->count(),
            'total_amount' => (float) ((clone $query)->sum('purchases.total') ?: 0),
            'total_due' => (float) ((clone $query)->sum('purchases.due_amount') ?: 0),
        ];

        $paginator = (clone $query)
            ->withCount('items')
            ->orderByDesc('purchases.purchase_date')
            ->orderByDesc('purchases.id')
            ->paginate($this->perPage($filters));

        return ['paginator' => $paginator, 'summary' => $summary];
    }

    public function sales(array $filters): array
    {
        $query = $this->salesQuery($filters);

        $summary = [
            'total_sales' => (clone $query)->count(),
            'completed_sales' => (clone $query)->where('sales.status', 'completed')->count(),
            'returned_sales' => (clone $query)->where('sales.status', 'returned')->count(),
            'sales_amount' => (float) ((clone $query)->where('sales.status', 'completed')->sum('sales.total') ?: 0),
            'refunded_amount' => (float) ((clone $query)->where('sales.status', 'returned')->sum('sales.refund_amount') ?: 0),
            'due_amount' => (float) ((clone $query)->sum('sales.due_amount') ?: 0),
        ];

        $paginator = (clone $query)
            ->withCount('items')
            ->orderByDesc('sales.sale_date')
            ->orderByDesc('sales.id')
            ->paginate($this->perPage($filters));

        return ['paginator' => $paginator, 'summary' => $summary];
    }

    public function salesReturns(array $filters): array
    {
        $query = $this->salesReturnsQuery($filters);

        $summary = [
            'total_returns' => (clone $query)->count(),
            'refunded_amount' => (float) ((clone $query)->sum('sales.refund_amount') ?: 0),
            'average_refund' => (float) ((clone $query)->avg('sales.refund_amount') ?: 0),
        ];

        $paginator = (clone $query)
            ->withCount('items')
            ->orderByDesc('sales.returned_at')
            ->orderByDesc('sales.id')
            ->paginate($this->perPage($filters));

        return ['paginator' => $paginator, 'summary' => $summary];
    }

    public function rows(string $report, array $filters): Collection
    {
        return match ($report) {
            'stocks' => $this->stocksQuery($filters)
                ->orderBy('products.name')
                ->orderBy('products.id')
                ->get(),
            'purchases' => $this->purchasesQuery($filters)
                ->withCount('items')
                ->orderByDesc('purchases.purchase_date')
                ->orderByDesc('purchases.id')
                ->get(),
            'sales' => $this->salesQuery($filters)
                ->with('items.product:id,cost_price')
                ->orderBy('sales.sale_date')
                ->orderBy('sales.sale_no')
                ->orderBy('sales.id')
                ->get(),
            'sales-returns' => $this->salesReturnsQuery($filters)
                ->withCount('items')
                ->orderByDesc('sales.returned_at')
                ->orderByDesc('sales.id')
                ->get(),
            default => throw new InvalidArgumentException("Unknown report: {$report}"),
        };
    }

    private function stocksQuery(array $filters): Builder
    {
        $query = Product::query()
            ->select('products.*')
            ->with(['category:id,name', 'createdByShop:id,name']);

        $search = $this->searchTerm($filters);
        if ($search !== null) {
            $term = $this->likeTerm($search);
            $query->where(function ($query) use ($term) {
                $query->where('products.name', 'like', $term)
                    ->orWhere('products.sku', 'like', $term);
            });
        }

        $this->applyShopFilter($query, 'products.created_by_shop_id', $filters);

        $stockStatus = $filters['stock_status'] ?? 'all';
        if ($stockStatus === 'in') {
            $query->where('products.stock', '>', 0);
        } elseif ($stockStatus === 'out') {
            $query->where('products.stock', '<=', 0);
        } elseif ($stockStatus === 'low') {
            $query->where('products.stock', '>', 0)
                ->where('products.stock_alert', '>', 0)
                ->whereColumn('products.stock', '<=', 'products.stock_alert');
        }

        return $query;
    }

    private function purchasesQuery(array $filters): Builder
    {
        $query = Purchase::query()
            ->with(['supplier:id,name', 'shop:id,name', 'paymentType:id,name']);

        $search = $this->searchTerm($filters);
        if ($search !== null) {
            $term = $this->likeTerm($search);
            $query->where(function ($query) use ($term) {
                $query->where('purchases.purchase_no', 'like', $term)
                    ->orWhere('purchases.reference_no', 'like', $term)
                    ->orWhereHas('supplier', fn ($supplier) => $supplier->where('name', 'like', $term));
            });
        }

        $this->applyShopFilter($query, 'purchases.shop_id', $filters);
        $this->applyDateRange($query, 'purchases.purchase_date', $filters);

        if (($filters['status'] ?? 'all') !== 'all') {
            $query->where('purchases.status', $filters['status']);
        }

        return $query;
    }

    private function salesQuery(array $filters): Builder
    {
        $query = Sale::query()
            ->with(['customer:id,name', 'shop:id,name', 'paymentType:id,name']);

        $search = $this->searchTerm($filters);
        if ($search !== null) {
            $term = $this->likeTerm($search);
            $query->where(function ($query) use ($term) {
                $query->where('sales.sale_no', 'like', $term)
                    ->orWhere('sales.reference_no', 'like', $term)
                    ->orWhereHas('customer', fn ($customer) => $customer->where('name', 'like', $term));
            });
        }

        $this->applyShopFilter($query, 'sales.shop_id', $filters);
        $this->applyDateRange($query, 'sales.sale_date', $filters);

        if (($filters['status'] ?? 'all') !== 'all') {
            $query->where('sales.status', $filters['status']);
        }

        return $query;
    }

    private function salesReturnsQuery(array $filters): Builder
    {
        $query = Sale::query()
            ->with(['customer:id,name', 'shop:id,name', 'paymentType:id,name'])
            ->where('sales.status', 'returned');

        $search = $this->searchTerm($filters);
        if ($search !== null) {
            $term = $this->likeTerm($search);
            $query->where(function ($query) use ($term) {
                $query->where('sales.sale_no', 'like', $term)
                    ->orWhere('sales.return_reason', 'like', $term)
                    ->orWhereHas('customer', fn ($customer) => $customer->where('name', 'like', $term));
            });
        }

        $this->applyShopFilter($query, 'sales.shop_id', $filters);
        $this->applyDateRange($query, 'sales.returned_at', $filters);

        return $query;
    }

    private function applyShopFilter(Builder $query, string $column, array $filters): void
    {
        if (($filters['shop_id'] ?? null) !== null) {
            $query->where($column, $filters['shop_id']);
        }
    }

    private function applyDateRange(Builder $query, string $column, array $filters): void
    {
        if (($filters['date_from'] ?? null) !== null) {
            $query->whereDate($column, '>=', $filters['date_from']);
        }

        if (($filters['date_to'] ?? null) !== null) {
            $query->whereDate($column, '<=', $filters['date_to']);
        }
    }

    private function searchTerm(array $filters): ?string
    {
        $search = trim((string) ($filters['search'] ?? ''));

        return $search === '' ? null : $search;
    }

    private function perPage(array $filters): int
    {
        return (int) ($filters['per_page'] ?? 10);
    }

    private function likeTerm(string $value): string
    {
        return '%'.addcslashes($value, '\\%_').'%';
    }
}
