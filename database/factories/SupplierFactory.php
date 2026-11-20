<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'nid_number' => fake()->numerify('##########'),
            'tin_number' => fake()->numerify('##########'),
            'trade_license_number' => fake()->bothify('TL-####-????'),
            'occupation' => fake()->jobTitle(),
            'is_active' => true,
        ];
    }
}
