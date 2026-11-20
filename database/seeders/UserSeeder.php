<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    private const PASSWORD = 'password';

    public function run(): void
    {
        // Super admin: full access across every shop.
        User::updateOrCreate(
            ['email' => 'superadmin@pos.test'],
            $this->profile('Super Admin', 0, null, 80000),
        )->syncRoles('super_admin');

        // Viewer: read-only access to the whole system.
        User::updateOrCreate(
            ['email' => 'viewer@pos.test'],
            $this->profile('Viewer', 9, null, 25000),
        )->syncRoles('viewer');

        // One manager per shop.
        foreach (Shop::orderBy('id')->get() as $i => $shop) {
            User::updateOrCreate(
                ['email' => 'manager'.($i + 1).'@pos.test'],
                $this->profile("পরিচালক ({$shop->name})", $i + 1, $shop->id, 35000),
            )->syncRoles('manager');
        }
    }

    /**
     * Placeholder profile data; replace with real employee details.
     */
    private function profile(string $name, int $n, ?int $shopId, float $salary): array
    {
        return [
            'name' => $name,
            'password' => self::PASSWORD,
            'shop_id' => $shopId,
            'phone' => sprintf('0171000%04d', $n),
            'nid_number' => sprintf('199012345%04d', $n),
            'date_of_birth' => '1990-01-01',
            'permanent_address' => 'Village, Upazila, District',
            'present_address' => 'Dhaka, Bangladesh',
            'salary_account_name' => $name,
            'salary_account_number' => sprintf('1020030%05d', $n),
            'bank_name' => 'Sample Bank Ltd.',
            'salary' => $salary,
            'joining_date' => '2024-01-01',
            'is_active' => true,
        ];
    }
}
