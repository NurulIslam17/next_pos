<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;

class DashboardService
{
    /** @return array<string, mixed> */
    public function data(?int $shopId = null, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $products = Product::query();
        if ($shopId !== null) {
            $products->where('products.created_by_shop_id', $shopId);
        }

        $lowStock = (clone $products)
            ->where('stock_alert', '>', 0)
            ->whereColumn('stock', '<=', 'stock_alert');

        $stockTotals = (clone $products)
            ->selectRaw('COUNT(CASE WHEN products.stock > 0 THEN 1 END) as in_stock_products, COUNT(CASE WHEN products.stock <= 0 THEN 1 END) as out_of_stock_products, COALESCE(SUM(CASE WHEN products.stock > 0 THEN products.stock ELSE 0 END), 0) as total_items_in_stock')
            ->first();

        $byCategory = (clone $products)
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->selectRaw('COALESCE(categories.name, ?) as name, COUNT(*) as count', ['Uncategorized'])
            ->groupBy('products.category_id', 'categories.name')
            ->orderByDesc('count')
            ->orderBy('name')
            ->get()
            ->map(fn ($row): array => [
                'name' => (string) $row->name,
                'count' => (int) $row->count,
            ])
            ->all();

        $purchases = Purchase::query();
        if ($shopId !== null) {
            $purchases->where('purchases.shop_id', $shopId);
        }
        if ($dateFrom !== null) {
            $purchases->whereDate('purchases.purchase_date', '>=', $dateFrom);
        }
        if ($dateTo !== null) {
            $purchases->whereDate('purchases.purchase_date', '<=', $dateTo);
        }

        $purchaseTotals = (clone $purchases)
            ->selectRaw("COUNT(*) as total_count, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count, COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count, COALESCE(SUM(total), 0) as total_amount, COALESCE(SUM(due_amount), 0) as total_due_amount")
            ->first();

        $recentPurchases = (clone $purchases)
            ->with('supplier:id,name')
            ->latest('purchase_date')
            ->limit(5)
            ->get(['id', 'purchase_no', 'purchase_date', 'supplier_id', 'total', 'status'])
            ->map(fn (Purchase $purchase): array => [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date?->toDateString(),
                'supplier_name' => $purchase->supplier?->name ?? '—',
                'total' => (float) $purchase->total,
                'status' => $purchase->status,
            ])
            ->all();

        $sales = Sale::query();
        if ($shopId !== null) {
            $sales->where('sales.shop_id', $shopId);
        }
        if ($dateFrom !== null) {
            $sales->whereDate('sales.sale_date', '>=', $dateFrom);
        }
        if ($dateTo !== null) {
            $sales->whereDate('sales.sale_date', '<=', $dateTo);
        }

        $saleTotals = (clone $sales)
            ->selectRaw("COUNT(CASE WHEN sales.status = 'completed' THEN 1 END) as total_count, COALESCE(SUM(CASE WHEN sales.status = 'completed' THEN sales.total ELSE 0 END), 0) as total_amount, COUNT(CASE WHEN sales.status = 'returned' THEN 1 END) as returned_count, COALESCE(SUM(CASE WHEN sales.status = 'returned' THEN sales.refund_amount ELSE 0 END), 0) as returned_amount")
            ->first();

        $topCustomers = (clone $sales)
            ->join('customers', 'customers.id', '=', 'sales.customer_id')
            ->where('sales.status', 'completed')
            ->selectRaw('customers.id as customer_id, customers.name as name, COUNT(*) as orders_count, COALESCE(SUM(sales.total), 0) as total_amount')
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->customer_id,
                'name' => (string) $row->name,
                'orders' => (int) $row->orders_count,
                'total' => (float) $row->total_amount,
            ])
            ->all();

        $topProducts = (clone $sales)
            ->join('sale_items', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->selectRaw('sale_items.product_id as product_id, sale_items.product_name as name, sale_items.product_sku as sku, SUM(sale_items.quantity) as units_sold, COALESCE(SUM(sale_items.line_total), 0) as total_amount')
            ->groupBy('sale_items.product_id', 'sale_items.product_name', 'sale_items.product_sku')
            ->orderByDesc('units_sold')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'id' => $row->product_id === null ? null : (int) $row->product_id,
                'name' => (string) $row->name,
                'sku' => (string) $row->product_sku,
                'units_sold' => (int) $row->units_sold,
                'total' => (float) $row->total_amount,
            ])
            ->all();

        $catalogue = $shopId !== null
            ? [
                'categories' => (int) (clone $products)->distinct()->count('products.category_id'),
                'brands' => (int) (clone $products)->distinct()->count('products.brand_id'),
                'suppliers' => (int) (clone $purchases)->distinct()->count('purchases.supplier_id'),
            ]
            : [
                'categories' => Category::count(),
                'brands' => Brand::count(),
                'suppliers' => Supplier::count(),
            ];

        return [
            'summary' => [
                'total_products' => (clone $products)->count(),
                'active_products' => (clone $products)->where('is_active', true)->count(),
                'inactive_products' => (clone $products)->where('is_active', false)->count(),
                'in_stock_products' => (int) $stockTotals->in_stock_products,
                'out_of_stock_products' => (int) $stockTotals->out_of_stock_products,
                'total_items_in_stock' => (int) $stockTotals->total_items_in_stock,
                'low_stock_products' => (clone $lowStock)->count(),
                'total_stock_value' => (float) ((clone $products)->selectRaw('SUM(products.stock * products.cost_price) as total')->value('total') ?: 0),
                'total_purchases' => (int) $purchaseTotals->total_count,
                'pending_purchases' => (int) $purchaseTotals->pending_count,
                'approved_purchases' => (int) $purchaseTotals->approved_count,
                'total_purchase_amount' => (float) $purchaseTotals->total_amount,
                'total_sales' => (int) $saleTotals->total_count,
                'total_sales_amount' => (float) $saleTotals->total_amount,
                'total_returned_sales' => (int) $saleTotals->returned_count,
                'returned_sales_amount' => (float) $saleTotals->returned_amount,
            ],
            'chart' => [
                'products_by_category' => $byCategory,
                'purchases_by_status' => [
                    ['name' => 'Pending', 'count' => (int) $purchaseTotals->pending_count],
                    ['name' => 'Approved', 'count' => (int) $purchaseTotals->approved_count],
                ],
            ],
            'statistics' => [
                'low_stock' => (clone $lowStock)
                    ->orderBy('stock')
                    ->limit(5)
                    ->get(['name', 'sku', 'stock', 'stock_alert'])
                    ->map(fn (Product $product): array => [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'stock' => $product->stock,
                        'stock_alert' => $product->stock_alert,
                    ])
                    ->all(),
                'catalogue' => $catalogue,
                'top_customers' => $topCustomers,
                'top_products' => $topProducts,
                'purchases' => [
                    'total_due' => (float) $purchaseTotals->total_due_amount,
                    'recent' => $recentPurchases,
                ],
            ],
        ];
    }
}
