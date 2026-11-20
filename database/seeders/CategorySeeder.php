<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $names = json_decode(file_get_contents(database_path('seeders/data/categories.json')), true);
        $createdBy = User::query()->value('id');

        foreach ($names as $name) {
            Category::firstOrCreate(['name' => $name], ['created_by' => $createdBy]);
        }
    }
}
