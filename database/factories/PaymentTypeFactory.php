<?php

namespace Database\Factories;

use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentType>
 */
class PaymentTypeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word().' Payment',
            'code' => fake()->unique()->bothify('PT-####-???'),
            'description' => fake()->sentence(),
            'created_by' => User::query()->value('id'),
            'status' => true,
        ];
    }
}
