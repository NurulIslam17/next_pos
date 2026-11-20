<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseItem>
 */
class PurchaseItemFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 20);
        $unitCost = fake()->randomFloat(2, 5, 500);

        return [
            'purchase_id' => Purchase::factory(),
            'product_id' => null,
            'product_name' => fake()->words(3, true),
            'product_sku' => fake()->unique()->bothify('SKU-####'),
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'vat_rate' => 0,
            'discount' => 0,
            'line_total' => round($quantity * $unitCost, 2),
        ];
    }
}
