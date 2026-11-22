<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProductCreateTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_creates_product_for_selected_shop(): void
    {
        $shop = Shop::create(['name' => 'Dhaka', 'code' => 'DHK']);
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson('/api/v1/products', $this->payload($shop->id, 'ADMIN-PRODUCT'));

        $response->assertCreated()
            ->assertJsonPath('data.created_by_shop_id', $shop->id)
            ->assertJsonPath('data.name', 'ADMIN-PRODUCT');

        $this->assertStringStartsWith('DHK'.now()->format('ymd'), $response->json('data.sku'));
        $this->assertDatabaseHas('products', [
            'name' => 'ADMIN-PRODUCT',
            'created_by_shop_id' => $shop->id,
        ]);
    }

    public function test_manager_creates_product_for_own_shop_when_another_shop_is_submitted(): void
    {
        $ownShop = Shop::create(['name' => 'Own Shop', 'code' => 'OWN']);
        $otherShop = Shop::create(['name' => 'Other Shop', 'code' => 'OTH']);
        $manager = $this->manager($ownShop);

        $response = $this->actingAs($manager)->postJson('/api/v1/products', $this->payload($otherShop->id, 'MANAGER-PRODUCT'));

        $response->assertCreated()
            ->assertJsonPath('data.created_by_shop_id', $ownShop->id);

        $this->assertDatabaseHas('products', [
            'name' => 'MANAGER-PRODUCT',
            'created_by_shop_id' => $ownShop->id,
        ]);
        $this->assertDatabaseMissing('products', [
            'name' => 'MANAGER-PRODUCT',
            'created_by_shop_id' => $otherShop->id,
        ]);
    }

    public function test_super_admin_cannot_create_product_without_shop(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->postJson('/api/v1/products', $this->payload(null, 'NO-SHOP'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('created_by_shop_id');

        $this->assertDatabaseMissing('products', ['name' => 'NO-SHOP']);
    }

    public function test_super_admin_cannot_create_product_for_unknown_shop(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->postJson('/api/v1/products', $this->payload(999999, 'BAD-SHOP'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('created_by_shop_id');

        $this->assertDatabaseMissing('products', ['name' => 'BAD-SHOP']);
    }

    public function test_super_admin_generates_sku_for_selected_shop(): void
    {
        $shop = Shop::create(['name' => 'Chittagong', 'code' => 'CTG']);
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->getJson('/api/v1/products/next-sku?shop_id='.$shop->id);

        $response->assertOk();
        $this->assertStringStartsWith('CTG'.now()->format('ymd'), $response->json('data.sku'));
    }

    /** @return array<string, mixed> */
    private function payload(?int $shopId, string $name): array
    {
        return [
            'name' => $name,
            'price' => 100,
            'created_by_shop_id' => $shopId,
        ];
    }

    private function superAdmin(): User
    {
        Role::findOrCreate('super_admin', 'web');
        $user = User::factory()->create(['shop_id' => null]);
        $user->assignRole('super_admin');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function manager(Shop $shop): User
    {
        Role::findOrCreate('manager', 'web');
        $user = User::factory()->create(['shop_id' => $shop->id]);
        $user->assignRole('manager');
        $user->givePermissionTo(Permission::findOrCreate('products.create', 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
