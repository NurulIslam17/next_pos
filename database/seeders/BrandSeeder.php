<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        Brand::firstOrCreate(
            ['name' => 'Prantik'],
            [
                'description' => 'Dummy brand for initial setup.',
                'created_by' => User::query()->value('id'),
                'status' => true,
            ],
        );
    }
}
