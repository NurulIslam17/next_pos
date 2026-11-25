<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
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

    public function registrar(array $filters): array
    {
        $rows = $this->registrarRows($filters);
        $perPage = $this->perPage($filters);
        $page = max((int) ($filters['page'] ?? 1), 1);

        $summary = [
            'total_transactions' => $rows->count(),
            'purchase_count' => $rows->where('type', 'Purchase')->count(),
            'sale_count' => $rows->where('type', 'Sale')->count(),
            'return_count' => $rows->where('type', 'Sale Return')->count(),
            'net_amount' => (float) $rows->sum('net_amount'),
        ];

        $paginator = new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values()->all(),
            $rows->count(),
            $perPage,
            $page,
        );

        return ['paginator' => $paginator, 'summary' => $summary];
    }

    public function dailyRegistrar(array $filters): array
    {
        $date = $filters['date'] ?? now()->toDateString();
        $dayFilters = array_merge($filters, ['date_from' => $date, 'date_to' => $date]);

        $purchases = $this->purchasesQuery(array_merge($dayFilters, ['status' => 'approved']))
            ->withCount('items')
            ->orderByDesc('purchases.purchase_date')
            ->orderByDesc('purchases.id')
            ->get()
            ->map(fn (Purchase $purchase): array => $this->dailyPurchaseRow($purchase))
            ->values()
            ->all();

        $expenses = $this->expensesQuery($dayFilters)
            ->orderByDesc('expenses.expense_date')
            ->orderByDesc('expenses.id')
            ->get()
            ->map(fn (Expense $expense): array => $this->dailyExpenseRow($expense))
            ->values()
            ->all();

        $sales = $this->salesQuery($dayFilters)
            ->withCount('items')
            ->orderByDesc('sales.sale_date')
            ->orderByDesc('sales.id')
            ->get()
            ->map(fn (Sale $sale): array => $this->dailySaleRow($sale))
            ->values()
            ->all();

        $purchaseTotal = round(collect($purchases)->sum('total'), 2);
        $expenseTotal = round(collect($expenses)->sum('amount'), 2);
        $salesTotal = round(collect($sales)->sum('total'), 2);

        return [
            'date' => $date,
            'purchases' => $purchases,
            'expenses' => $expenses,
            'sales' => $sales,
            'summary' => [
                'purchase_count' => count($purchases),
                'purchase_total' => $purchaseTotal,
                'purchase_paid' => round(collect($purchases)->sum('paid_amount'), 2),
                'expense_count' => count($expenses),
                'expense_total' => $expenseTotal,
                'sales_count' => count($sales),
                'sales_total' => $salesTotal,
                'sales_paid' => round(collect($sales)->sum('paid_amount'), 2),
                'net_amount' => round($salesTotal - $purchaseTotal - $expenseTotal, 2),
            ],
        ];
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
            'registrar' => $this->registrarRows($filters),
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

    private function expensesQuery(array $filters): Builder
    {
        $query = Expense::query()->with(['shop:id,name,code']);

        $search = $this->searchTerm($filters);
        if ($search !== null) {
            $term = $this->likeTerm($search);
            $query->where(function ($query) use ($term) {
                $query->where('expenses.category', 'like', $term)
                    ->orWhere('expenses.reference_no', 'like', $term)
                    ->orWhere('expenses.note', 'like', $term);
            });
        }

        $this->applyShopFilter($query, 'expenses.shop_id', $filters);
        $this->applyDateRange($query, 'expenses.expense_date', $filters);

        return $query;
    }

    private function registrarRows(array $filters): Collection
    {
        $purchases = $this->purchasesQuery($filters)
            ->withCount('items')
            ->get()
            ->map(fn (Purchase $purchase): array => $this->registrarPurchaseRow($purchase));

        $sales = $this->salesQuery($filters)
            ->where('sales.status', '!=', 'returned')
            ->withCount('items')
            ->get()
            ->map(fn (Sale $sale): array => $this->registrarSaleRow($sale));

        $returns = $this->salesReturnsQuery($filters)
            ->withCount('items')
            ->get()
            ->map(fn (Sale $sale): array => $this->registrarReturnRow($sale));

        return $purchases
            ->concat($sales)
            ->concat($returns)
            ->sortByDesc(fn (array $row): int => $row['sort_at']?->timestamp ?? 0)
            ->values();
    }

    private function registrarPurchaseRow(Purchase $purchase): array
    {
        $total = (float) $purchase->total;

        return [
            'id' => 'purchase-'.$purchase->id,
            'date' => $purchase->purchase_date?->toDateString() ?? '',
            'type' => 'Purchase',
            'reference_no' => $purchase->purchase_no,
            'party_name' => $purchase->supplier?->name ?? '',
            'shop_name' => $purchase->shop?->name ?? '',
            'item_count' => (int) ($purchase->items_count ?? 0),
            'subtotal' => (float) $purchase->subtotal,
            'discount' => (float) $purchase->discount,
            'vat' => (float) $purchase->vat,
            'total' => $total,
            'paid_amount' => (float) $purchase->paid_amount,
            'due_amount' => (float) $purchase->due_amount,
            'status' => ucfirst((string) $purchase->status),
            'net_amount' => -$total,
            'sort_at' => $purchase->purchase_date,
        ];
    }

    private function registrarSaleRow(Sale $sale): array
    {
        $total = (float) $sale->total;

        return [
            'id' => 'sale-'.$sale->id,
            'date' => $sale->sale_date?->toDateString() ?? '',
            'type' => 'Sale',
            'reference_no' => $sale->sale_no,
            'party_name' => $sale->customer?->name ?? '',
            'shop_name' => $sale->shop?->name ?? '',
            'item_count' => (int) ($sale->items_count ?? 0),
            'subtotal' => (float) $sale->subtotal,
            'discount' => (float) $sale->discount,
            'vat' => (float) $sale->vat,
            'total' => $total,
            'paid_amount' => (float) $sale->paid_amount,
            'due_amount' => (float) $sale->due_amount,
            'status' => ucfirst((string) $sale->status),
            'net_amount' => $total,
            'sort_at' => $sale->sale_date,
        ];
    }

    private function registrarReturnRow(Sale $sale): array
    {
        $refund = abs((float) $sale->refund_amount);

        return [
            'id' => 'return-'.$sale->id,
            'date' => ($sale->returned_at ?? $sale->sale_date)?->toDateString() ?? '',
            'type' => 'Sale Return',
            'reference_no' => $sale->sale_no,
            'party_name' => $sale->customer?->name ?? '',
            'shop_name' => $sale->shop?->name ?? '',
            'item_count' => (int) ($sale->items_count ?? 0),
            'subtotal' => 0.0,
            'discount' => 0.0,
            'vat' => 0.0,
            'total' => $refund,
            'paid_amount' => $refund,
            'due_amount' => 0.0,
            'status' => 'Refunded',
            'net_amount' => -$refund,
            'sort_at' => $sale->returned_at ?? $sale->sale_date,
        ];
    }

    private function dailyPurchaseRow(Purchase $purchase): array
    {
        return [
            'id' => $purchase->id,
            'date' => $purchase->purchase_date?->toDateString() ?? '',
            'reference_no' => $purchase->purchase_no,
            'party_name' => $purchase->supplier?->name ?? '-',
            'shop_name' => $purchase->shop?->name ?? '-',
            'item_count' => (int) ($purchase->items_count ?? 0),
            'total' => (float) $purchase->total,
            'paid_amount' => (float) $purchase->paid_amount,
            'due_amount' => (float) $purchase->due_amount,
            'status' => ucfirst((string) $purchase->status),
        ];
    }

    private function dailyExpenseRow(Expense $expense): array
    {
        return [
            'id' => $expense->id,
            'date' => $expense->expense_date?->toDateString() ?? '',
            'category' => $expense->category,
            'reference_no' => $expense->reference_no ?? '-',
            'shop_name' => $expense->shop?->name ?? '-',
            'note' => $expense->note ?? '-',
            'amount' => (float) $expense->amount,
        ];
    }

    private function dailySaleRow(Sale $sale): array
    {
        return [
            'id' => $sale->id,
            'date' => $sale->sale_date?->toDateString() ?? '',
            'reference_no' => $sale->sale_no,
            'party_name' => $sale->customer?->name ?? 'Walk-in Customer',
            'shop_name' => $sale->shop?->name ?? '-',
            'item_count' => (int) ($sale->items_count ?? 0),
            'total' => (float) $sale->total,
            'paid_amount' => (float) $sale->paid_amount,
            'due_amount' => (float) $sale->due_amount,
            'status' => ucfirst((string) $sale->status),
        ];
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
