<?php

namespace Database\Seeders;

use App\Models\LandingPage;
use App\Models\User;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    public function run(): void
    {
        if (LandingPage::query()->exists()) {
            return;
        }

        LandingPage::create([
            ...LandingPage::defaultContent(),
            'created_by' => User::query()->value('id'),
        ]);
    }
}
