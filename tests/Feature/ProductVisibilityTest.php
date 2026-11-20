<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProductVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_sees_products_from_all_shops(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $this->product($shopA, 'SKUA-1', 'Product A');
        $this->product($shopB, 'SKUB-1', 'Product B');
        $user = $this->userWithRole('super_admin');

        $response = $this->actingAs($user)->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['sku' => 'SKUA-1'])
            ->assertJsonFragment(['sku' => 'SKUB-1']);
    }

    public function test_viewer_sees_products_from_all_shops(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $this->product($shopA, 'SKUA-1', 'Product A');
        $this->product($shopB, 'SKUB-1', 'Product B');
        $user = $this->userWithRole('viewer');

        $response = $this->actingAs($user)->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['sku' => 'SKUA-1'])
            ->assertJsonFragment(['sku' => 'SKUB-1']);
    }

    public function test_manager_sees_only_products_from_own_shop(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $this->product($shopA, 'SKUA-1', 'Product A');
        $this->product($shopB, 'SKUB-1', 'Product B');
        $user = $this->userWithRole('manager', $shopA->id);

        $response = $this->actingAs($user)->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.sku', 'SKUA-1')
            ->assertJsonMissing(['sku' => 'SKUB-1']);
    }

    public function test_manager_without_shop_sees_no_products(): void
    {
        $shop = $this->shop('SHA');
        $this->product($shop, 'SKUA-1', 'Product A');
        $user = $this->userWithRole('manager');

        $this->actingAs($user)->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonPath('data', []);
    }

    public function test_manager_cannot_show_product_from_another_shop(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $ownProduct = $this->product($shopA, 'SKUA-1', 'Product A');
        $otherProduct = $this->product($shopB, 'SKUB-1', 'Product B');
        $user = $this->userWithRole('manager', $shopA->id);

        $this->actingAs($user)->getJson("/api/v1/products/{$ownProduct->id}")->assertOk();
        $this->actingAs($user)->getJson("/api/v1/products/{$otherProduct->id}")->assertNotFound();
    }

    public function test_manager_cannot_reuse_sku_from_another_shop(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $this->product($shopB, 'SHARED-SKU', 'Product B');
        $user = $this->userWithRole('manager', $shopA->id, ['products.view', 'products.create']);

        $this->actingAs($user)->postJson('/api/v1/products', [
            'name' => 'Product A',
            'sku' => 'SHARED-SKU',
            'price' => 10,
        ])->assertUnprocessable()->assertJsonValidationErrors('sku');
    }

    private function shop(string $code): Shop
    {
        return Shop::create(['name' => "{$code} Shop", 'code' => $code]);
    }

    private function product(Shop $shop, string $sku, string $name): Product
    {
        return Product::create([
            'created_by_shop_id' => $shop->id,
            'name' => $name,
            'sku' => $sku,
            'price' => 10,
            'stock' => 1,
            'is_active' => true,
        ]);
    }

    /** @param list<string> $permissions */
    private function userWithRole(string $role, ?int $shopId = null, array $permissions = ['products.view']): User
    {
        Role::findOrCreate($role, 'web');
        $user = User::factory()->create(['shop_id' => $shopId]);
        $user->assignRole($role);

        $records = collect($permissions)->map(fn (string $name): Permission => Permission::findOrCreate($name, 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($records);

        return $user;
    }
}
