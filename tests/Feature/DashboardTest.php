<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_forbids_user_without_dashboard_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/dashboard')->assertForbidden();
    }

    public function test_returns_inventory_summary_and_chart_data(): void
    {
        $user = User::factory()->create();
        $permission = Permission::findOrCreate('dashboard.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);

        $category = Category::factory()->create(['name' => 'Beverages', 'created_by' => $user->id]);
        $brand = Brand::factory()->create(['created_by' => $user->id]);
        $supplier = Supplier::factory()->create();

        Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'supplier_id' => $supplier->id,
            'name' => 'Coffee',
            'sku' => 'COFFEE-1',
            'cost_price' => 10,
            'price' => 15,
            'stock' => 5,
            'stock_alert' => 5,
            'is_active' => true,
        ]);
        Product::create([
            'category_id' => $category->id,
            'name' => 'Tea',
            'sku' => 'TEA-1',
            'cost_price' => 20,
            'price' => 30,
            'stock' => 20,
            'stock_alert' => 5,
            'is_active' => true,
        ]);
        Product::create([
            'name' => 'Sugar',
            'sku' => 'SUGAR-1',
            'cost_price' => 5,
            'price' => 8,
            'stock' => 100,
            'stock_alert' => 10,
            'is_active' => false,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.summary.total_products', 3)
            ->assertJsonPath('data.summary.active_products', 2)
            ->assertJsonPath('data.summary.inactive_products', 1)
            ->assertJsonPath('data.summary.low_stock_products', 1)
            ->assertJsonPath('data.summary.total_stock_value', 950)
            ->assertJsonPath('data.chart.products_by_category.0.name', 'Beverages')
            ->assertJsonPath('data.chart.products_by_category.0.count', 2)
            ->assertJsonPath('data.statistics.low_stock.0.sku', 'COFFEE-1')
            ->assertJsonPath('data.statistics.catalogue.categories', 1)
            ->assertJsonPath('data.statistics.catalogue.brands', 1)
            ->assertJsonPath('data.statistics.catalogue.suppliers', 1);
    }

    public function test_returns_purchase_summary_and_recent_purchases(): void
    {
        $user = User::factory()->create();
        $permission = Permission::findOrCreate('dashboard.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);
        $supplier = Supplier::factory()->create(['name' => 'Acme Supply']);

        Purchase::factory()->create([
            'purchase_no' => 'PUR-OLD',
            'purchase_date' => '2026-11-10',
            'supplier_id' => $supplier->id,
            'status' => 'approved',
            'total' => 100,
            'due_amount' => 0,
        ]);
        Purchase::factory()->create([
            'purchase_no' => 'PUR-PENDING',
            'purchase_date' => '2026-11-15',
            'supplier_id' => $supplier->id,
            'status' => 'pending',
            'total' => 200,
            'due_amount' => 200,
        ]);
        Purchase::factory()->create([
            'purchase_no' => 'PUR-NEW',
            'purchase_date' => '2026-11-20',
            'supplier_id' => $supplier->id,
            'status' => 'approved',
            'total' => 950,
            'due_amount' => 50,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.summary.total_purchases', 3)
            ->assertJsonPath('data.summary.pending_purchases', 1)
            ->assertJsonPath('data.summary.approved_purchases', 2)
            ->assertJsonPath('data.summary.total_purchase_amount', 1250)
            ->assertJsonPath('data.chart.purchases_by_status.0.name', 'Pending')
            ->assertJsonPath('data.chart.purchases_by_status.0.count', 1)
            ->assertJsonPath('data.chart.purchases_by_status.1.name', 'Approved')
            ->assertJsonPath('data.chart.purchases_by_status.1.count', 2)
            ->assertJsonPath('data.statistics.purchases.total_due', 250)
            ->assertJsonPath('data.statistics.purchases.recent.0.purchase_no', 'PUR-NEW')
            ->assertJsonPath('data.statistics.purchases.recent.0.supplier_name', 'Acme Supply');
    }

    public function test_manager_only_sees_own_shop_purchase_metrics(): void
    {
        $shopA = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $shopB = Shop::create(['name' => 'Shop B', 'code' => 'SHB']);
        $manager = User::factory()->create(['shop_id' => $shopA->id]);
        Role::findOrCreate('manager', 'web');
        $manager->assignRole('manager');
        $permission = Permission::findOrCreate('dashboard.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $manager->givePermissionTo($permission);

        Purchase::factory()->create([
            'purchase_no' => 'PUR-SHA',
            'shop_id' => $shopA->id,
            'total' => 100,
            'due_amount' => 0,
        ]);
        Purchase::factory()->create([
            'purchase_no' => 'PUR-SHB',
            'shop_id' => $shopB->id,
            'total' => 500,
            'due_amount' => 500,
        ]);

        $response = $this->actingAs($manager)->getJson('/api/v1/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.summary.total_purchases', 1)
            ->assertJsonPath('data.summary.total_purchase_amount', 100)
            ->assertJsonPath('data.statistics.purchases.recent.0.purchase_no', 'PUR-SHA')
            ->assertJsonMissing(['purchase_no' => 'PUR-SHB']);
    }
}
