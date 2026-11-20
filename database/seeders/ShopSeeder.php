<?php

namespace Database\Seeders;

use App\Models\Shop;
use Illuminate\Database\Seeder;

class ShopSeeder extends Seeder
{
    public function run(): void
    {

        $cities = [
            ['code' => 'DHK', 'name' => 'ঢাকা'],
            ['code' => 'CTG', 'name' => 'চট্টগ্রাম'],
            ['code' => 'KHL', 'name' => 'খুলনা'],
            ['code' => 'RAJ', 'name' => 'রাজশাহী'],
            ['code' => 'SYL', 'name' => 'সিলেট'],
            ['code' => 'BAR', 'name' => 'বরিশাল'],
            ['code' => 'RNG', 'name' => 'রংপুর'],
            ['code' => 'MYM', 'name' => 'ময়মনসিংহ'],
        ];

        foreach ($cities as $city) {
            Shop::firstOrCreate(
                ['code' => $city['code']],
                [
                    'name' => "প্রান্তিক শিল্প প্রদর্শনী ও বিপণন কেন্দ্র, {$city['name']}",
                    'is_active' => true,
                ]
            );
        }
    }
}
