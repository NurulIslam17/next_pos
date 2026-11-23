<?php

namespace Database\Factories;

use App\Models\LandingPage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LandingPage>
 */
class LandingPageFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            ...LandingPage::defaultContent(),
            'created_by' => User::query()->value('id'),
        ];
    }
}
