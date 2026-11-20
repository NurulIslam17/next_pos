<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 50, 2000);

        return [
            'purchase_no' => fake()->unique()->numerify('PUR-######'),
            'purchase_date' => fake()->date(),
            'supplier_id' => null,
            'shop_id' => null,
            'payment_type_id' => null,
            'reference_no' => fake()->optional()->bothify('REF-####'),
            'note' => fake()->optional()->sentence(),
            'subtotal' => $total,
            'discount' => 0,
            'vat' => 0,
            'total' => $total,
            'paid_amount' => $total,
            'due_amount' => 0,
            'created_by' => User::query()->value('id'),
        ];
    }
}
