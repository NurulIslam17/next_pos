<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            ShopSeeder::class,
            UserSeeder::class,
            LandingPageSeeder::class,
            CategorySeeder::class,
            BrandSeeder::class,
            ProductSeeder::class,
            SupplierSeeder::class,
            PaymentTypeSeeder::class,
            CustomerSeeder::class,
            PurchaseSeeder::class,
            PurchaseItemSeeder::class,
            SaleSeeder::class,
        ]);
    }
}
