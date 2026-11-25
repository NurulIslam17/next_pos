<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'expense_date' => fake()->date(),
            'shop_id' => Shop::create(['name' => fake()->company(), 'code' => strtoupper(fake()->lexify('???'))])->id,
            'created_by' => User::factory(),
            'category' => fake()->randomElement(['Rent', 'Utilities', 'Supplies', 'Salary']),
            'reference_no' => fake()->optional()->bothify('EXP-####'),
            'amount' => fake()->randomFloat(2, 10, 2000),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
