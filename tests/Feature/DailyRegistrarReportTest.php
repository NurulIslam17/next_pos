<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DailyRegistrarReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_registrar_requires_authentication(): void
    {
        $this->getJson('/api/v1/reports/daily-registrar')->assertUnauthorized();
    }

    public function test_daily_registrar_requires_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/v1/reports/daily-registrar')
            ->assertForbidden();
    }

    public function test_daily_registrar_returns_purchases_expenses_sales_and_summary(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $supplier = Supplier::factory()->create(['name' => 'Acme']);

        Purchase::factory()->create([
            'purchase_no' => 'PUR-001',
            'purchase_date' => '2026-11-24',
            'supplier_id' => $supplier->id,
            'shop_id' => $shop->id,
            'total' => 100,
            'paid_amount' => 60,
            'due_amount' => 40,
            'status' => 'approved',
        ]);

        Expense::factory()->create([
            'expense_date' => '2026-11-24',
            'shop_id' => $shop->id,
            'category' => 'Rent',
            'amount' => 30,
        ]);

        Sale::factory()->create([
            'sale_no' => 'SAL-001',
            'sale_date' => '2026-11-24',
            'shop_id' => $shop->id,
            'total' => 200,
            'paid_amount' => 150,
            'due_amount' => 50,
            'status' => 'completed',
        ]);

        Sale::factory()->create([
            'sale_no' => 'SAL-OLD',
            'sale_date' => '2026-11-23',
            'shop_id' => $shop->id,
            'total' => 999,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/reports/daily-registrar?date=2026-11-24');

        $response->assertOk()
            ->assertJsonPath('data.date', '2026-11-24')
            ->assertJsonCount(1, 'data.purchases')
            ->assertJsonCount(1, 'data.expenses')
            ->assertJsonCount(1, 'data.sales')
            ->assertJsonPath('data.purchases.0.reference_no', 'PUR-001')
            ->assertJsonPath('data.expenses.0.category', 'Rent')
            ->assertJsonPath('data.sales.0.reference_no', 'SAL-001')
            ->assertJsonPath('data.summary.purchase_total', 100)
            ->assertJsonPath('data.summary.expense_total', 30)
            ->assertJsonPath('data.summary.sales_total', 200)
            ->assertJsonPath('data.summary.net_amount', 70)
            ->assertJsonMissing(['reference_no' => 'SAL-OLD']);
    }

    public function test_daily_registrar_pdf_export_returns_pdf(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);

        Expense::factory()->create([
            'expense_date' => '2026-11-24',
            'shop_id' => $shop->id,
            'category' => 'Utilities',
            'amount' => 25,
        ]);

        $response = $this->actingAs($user)->get('/api/v1/reports/daily-registrar/pdf?date=2026-11-24&shop_id='.$shop->id);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('daily-registrar-report-2026-11-24', (string) $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF', $response->streamedContent());
    }

    private function userWithPermission(?int $shopId = null): User
    {
        $user = User::factory()->create(['shop_id' => $shopId]);
        $permission = Permission::findOrCreate('reports.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);

        return $user;
    }
}
