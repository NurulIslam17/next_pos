<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProductImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => 1,
            'path' => 'products/'.$this->faker->uuid().'.jpg',
            'original_name' => $this->faker->word().'.jpg',
            'sort_order' => 0,
        ];
    }
}
