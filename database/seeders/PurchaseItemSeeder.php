<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Database\Seeder;

class PurchaseItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = json_decode(file_get_contents(database_path('seeders/data/purchase_items.json')), true);
        $productIds = Product::query()->pluck('id', 'sku');
        $purchaseIds = Purchase::query()
            ->whereIn('reference_no', array_column($items, 'reference_no'))
            ->pluck('id', 'reference_no');
        $now = now();

        if ($purchaseIds->isNotEmpty()) {
            PurchaseItem::query()->whereIn('purchase_id', $purchaseIds->values()->all())->delete();
        }

        $rows = [];
        foreach ($items as $item) {
            $purchaseId = $purchaseIds[$item['reference_no']] ?? null;
            $sku = $item['product_sku'];

            if ($purchaseId === null) {
                continue;
            }

            $rows[] = [
                'purchase_id' => $purchaseId,
                'product_id' => $productIds[$sku] ?? null,
                'product_name' => $item['product_name'],
                'product_sku' => $sku ?? '',
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'vat_rate' => 0,
                'discount' => 0,
                'line_total' => $item['line_total'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            PurchaseItem::query()->insert($chunk);
        }
    }
}
