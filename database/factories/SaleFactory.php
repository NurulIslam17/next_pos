<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\PaymentType;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Sale> */
class SaleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 100, 5000);
        $paidAmount = $total;

        return [
            'sale_no' => 'SAL-'.fake()->unique()->numerify('######'),
            'sale_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'customer_id' => Customer::query()->value('id'),
            'shop_id' => Shop::query()->value('id'),
            'payment_type_id' => PaymentType::query()->value('id'),
            'reference_no' => fake()->optional()->bothify('REF-####'),
            'note' => fake()->optional()->sentence(),
            'subtotal' => $total,
            'discount' => 0,
            'vat' => 0,
            'total' => $total,
            'paid_amount' => $paidAmount,
            'due_amount' => 0,
            'status' => 'completed',
            'refund_amount' => 0,
            'created_by' => User::query()->value('id'),
        ];
    }
}
