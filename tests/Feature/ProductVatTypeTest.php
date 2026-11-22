<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProductVatTypeTest extends TestCase
{
    use RefreshDatabase;

    public function test_defaults_vat_type_to_included(): void
    {
        $user = $this->userWithCreatePermission();

        $response = $this->actingAs($user)->postJson('/api/v1/products', [
            'name' => 'Notebook',
            'price' => 10,
            'created_by_shop_id' => $user->shop_id,
            'vat' => 5,
        ]);

        $response->assertCreated()->assertJsonPath('data.vat_type', 'included');
        $this->assertDatabaseHas('products', ['name' => 'Notebook', 'vat_type' => 'included']);
    }

    public function test_accepts_excluded_vat_type(): void
    {
        $user = $this->userWithCreatePermission();

        $response = $this->actingAs($user)->postJson('/api/v1/products', [
            'name' => 'Pen',
            'price' => 10,
            'created_by_shop_id' => $user->shop_id,
            'vat' => 5,
            'vat_type' => 'excluded',
        ]);

        $response->assertCreated()->assertJsonPath('data.vat_type', 'excluded');
        $this->assertDatabaseHas('products', ['name' => 'Pen', 'vat_type' => 'excluded']);
    }

    public function test_rejects_invalid_vat_type(): void
    {
        $user = $this->userWithCreatePermission();

        $this->actingAs($user)->postJson('/api/v1/products', [
            'name' => 'Eraser',
            'price' => 10,
            'created_by_shop_id' => $user->shop_id,
            'vat_type' => 'maybe',
        ])->assertUnprocessable()->assertJsonValidationErrors('vat_type');
    }

    private function userWithCreatePermission(): User
    {
        $shop = Shop::create(['name' => 'VAT Shop', 'code' => 'VAT']);
        $user = User::factory()->create(['shop_id' => $shop->id]);
        Permission::findOrCreate('products.create', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo('products.create');

        return $user;
    }
}
