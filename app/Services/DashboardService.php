<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
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
                'low_stock_products' => (clone $lowStock)->count(),
                'total_stock_value' => (float) ((clone $products)->selectRaw('SUM(products.stock * products.cost_price) as total')->value('total') ?: 0),
                'total_purchases' => (int) $purchaseTotals->total_count,
                'pending_purchases' => (int) $purchaseTotals->pending_count,
                'approved_purchases' => (int) $purchaseTotals->approved_count,
                'total_purchase_amount' => (float) $purchaseTotals->total_amount,
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
                'purchases' => [
                    'total_due' => (float) $purchaseTotals->total_due_amount,
                    'recent' => $recentPurchases,
                ],
            ],
        ];
    }
}
