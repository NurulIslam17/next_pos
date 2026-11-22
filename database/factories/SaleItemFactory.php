<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SaleItem> */
class SaleItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 20);
        $unitPrice = fake()->randomFloat(2, 10, 500);

        return [
            'sale_id' => Sale::factory(),
            'product_id' => null,
            'product_name' => fake()->words(3, true),
            'product_sku' => fake()->unique()->bothify('SKU-####'),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'vat_rate' => 0,
            'discount' => 0,
            'line_total' => round($quantity * $unitPrice, 2),
        ];
    }
}
