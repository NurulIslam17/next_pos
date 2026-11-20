<?php

namespace Database\Seeders;

use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $createdBy = User::query()->value('id');

        foreach ([
            ['name' => 'Cash', 'code' => 'CASH', 'description' => 'Cash payment at the counter.'],
            ['name' => 'Card', 'code' => 'CARD', 'description' => 'Debit or credit card payment.'],
            ['name' => 'Bank Transfer', 'code' => 'BANK', 'description' => 'Direct bank transfer.'],
            ['name' => 'Mobile Banking', 'code' => 'MOBILE', 'description' => 'Mobile banking or wallet payment.'],
        ] as $paymentType) {
            PaymentType::firstOrCreate(
                ['code' => $paymentType['code']],
                [...$paymentType, 'created_by' => $createdBy, 'status' => true],
            );
        }
    }
}
