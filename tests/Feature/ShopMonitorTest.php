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
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ShopMonitorTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/shop-monitor')->assertUnauthorized();
    }

    public function test_forbids_user_without_shop_monitor_permission(): void
    {
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/v1/shop-monitor?shop_id='.$shop->id)
            ->assertForbidden();
    }

    public function test_validates_shop_and_date_range(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);

        $this->actingAs($user)->getJson('/api/v1/shop-monitor')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['shop_id']);

        $this->actingAs($user)->getJson('/api/v1/shop-monitor?shop_id=999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['shop_id']);

        $this->actingAs($user)->getJson("/api/v1/shop-monitor?shop_id={$shop->id}&date_from=2026-11-20&date_to=2026-11-10")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_to']);
    }

    public function test_returns_shop_summary_for_selected_shop_and_date_range(): void
    {
        $user = $this->userWithPermission();
        $shopA = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $shopB = Shop::create(['name' => 'Shop B', 'code' => 'SHB']);
        $categoryA = Category::factory()->create(['name' => 'Drinks']);
        $categoryB = Category::factory()->create(['name' => 'Snacks']);
        $brandA = Brand::factory()->create(['name' => 'Brand A']);
        $brandB = Brand::factory()->create(['name' => 'Brand B']);
        $supplierA = Supplier::factory()->create(['name' => 'Acme']);
        $supplierB = Supplier::factory()->create(['name' => 'Other']);

        Product::create([
            'category_id' => $categoryA->id,
            'brand_id' => $brandA->id,
            'supplier_id' => $supplierA->id,
            'created_by_shop_id' => $shopA->id,
            'name' => 'Coffee',
            'sku' => 'SHA-COFFEE',
            'cost_price' => 10,
            'price' => 15,
            'stock' => 5,
            'stock_alert' => 5,
            'is_active' => true,
        ]);
        Product::create([
            'category_id' => $categoryB->id,
            'brand_id' => $brandB->id,
            'supplier_id' => $supplierB->id,
            'created_by_shop_id' => $shopB->id,
            'name' => 'Chips',
            'sku' => 'SHB-CHIPS',
            'cost_price' => 100,
            'price' => 150,
            'stock' => 100,
            'stock_alert' => 5,
            'is_active' => true,
        ]);

        Purchase::factory()->create([
            'shop_id' => $shopA->id,
            'purchase_no' => 'PUR-A-IN',
            'purchase_date' => '2026-11-15',
            'supplier_id' => $supplierA->id,
            'status' => 'approved',
            'total' => 100,
            'due_amount' => 20,
        ]);
        Purchase::factory()->create([
            'shop_id' => $shopA->id,
            'purchase_no' => 'PUR-A-OUT',
            'purchase_date' => '2026-11-10',
            'supplier_id' => $supplierA->id,
            'status' => 'pending',
            'total' => 900,
            'due_amount' => 900,
        ]);
        Purchase::factory()->create([
            'shop_id' => $shopB->id,
            'purchase_no' => 'PUR-B-IN',
            'purchase_date' => '2026-11-16',
            'supplier_id' => $supplierB->id,
            'status' => 'pending',
            'total' => 500,
            'due_amount' => 500,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/shop-monitor?'.http_build_query([
            'shop_id' => $shopA->id,
            'date_from' => '2026-11-15',
            'date_to' => '2026-11-20',
        ]));

        $response->assertOk()
            ->assertJsonPath('data.shop.id', $shopA->id)
            ->assertJsonPath('data.shop.name', 'Shop A')
            ->assertJsonPath('data.period.date_from', '2026-11-15')
            ->assertJsonPath('data.period.date_to', '2026-11-20')
            ->assertJsonPath('data.summary.total_products', 1)
            ->assertJsonPath('data.summary.active_products', 1)
            ->assertJsonPath('data.summary.low_stock_products', 1)
            ->assertJsonPath('data.summary.total_stock_value', 50)
            ->assertJsonPath('data.chart.products_by_category.0.name', 'Drinks')
            ->assertJsonPath('data.chart.products_by_category.0.count', 1)
            ->assertJsonPath('data.summary.total_purchases', 1)
            ->assertJsonPath('data.summary.approved_purchases', 1)
            ->assertJsonPath('data.summary.total_purchase_amount', 100)
            ->assertJsonPath('data.statistics.purchases.total_due', 20)
            ->assertJsonPath('data.statistics.purchases.recent.0.purchase_no', 'PUR-A-IN')
            ->assertJsonPath('data.statistics.catalogue.categories', 1)
            ->assertJsonPath('data.statistics.catalogue.brands', 1)
            ->assertJsonPath('data.statistics.catalogue.suppliers', 1)
            ->assertJsonMissing(['purchase_no' => 'PUR-A-OUT'])
            ->assertJsonMissing(['purchase_no' => 'PUR-B-IN'])
            ->assertJsonMissing(['sku' => 'SHB-CHIPS']);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        $permission = Permission::findOrCreate('shop_monitor.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);

        return $user;
    }
}
