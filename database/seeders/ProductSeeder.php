<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = json_decode(file_get_contents(database_path('seeders/data/products.json')), true);
        $categories = Category::pluck('id', 'name');
        $now = now();

        $rows = array_map(fn ($p) => [
            'created_by_shop_id' => $p['shop_id'] ?? 1,
            'category_id' => $categories[$p['category']] ?? null,
            'name' => $p['name'],
            'sku' => $p['sku'],
            'cost_price' => $p['cost_price'],
            'price' => $p['price'],
            'stock' => 0,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $products);

        foreach (array_chunk($rows, 500) as $chunk) {
            Product::upsert($chunk, ['sku'], ['created_by_shop_id', 'category_id', 'name', 'cost_price', 'price', 'updated_at']);
        }
    }
}
