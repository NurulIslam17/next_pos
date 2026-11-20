<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $names = json_decode(file_get_contents(database_path('seeders/data/suppliers.json')), true);

        foreach ($names as $name) {
            Supplier::firstOrCreate(['name' => $name]);
        }
    }
}
