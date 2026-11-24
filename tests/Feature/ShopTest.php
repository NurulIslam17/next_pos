<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ShopTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_accepts_three_character_shop_code(): void
    {
        $shop = Shop::create(['name' => 'Dhaka', 'code' => 'DHK']);
        $user = $this->userWithPermission('shops.update');

        $this->actingAs($user)->putJson("/api/v1/shops/{$shop->id}", [
            'name' => 'Renamed Shop',
            'code' => 'NEW',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Renamed Shop')
            ->assertJsonPath('data.code', 'NEW');

        $this->assertDatabaseHas('shops', [
            'id' => $shop->id,
            'name' => 'Renamed Shop',
            'code' => 'NEW',
        ]);
    }

    public function test_update_rejects_shop_code_longer_than_three_characters(): void
    {
        $shop = Shop::create(['name' => 'Dhaka', 'code' => 'DHK']);
        $user = $this->userWithPermission('shops.update');

        $this->actingAs($user)->putJson("/api/v1/shops/{$shop->id}", [
            'code' => 'LONG',
        ])->assertUnprocessable()->assertJsonValidationErrors('code');

        $this->assertDatabaseHas('shops', ['id' => $shop->id, 'code' => 'DHK']);
    }

    public function test_create_rejects_shop_code_longer_than_three_characters(): void
    {
        $user = $this->userWithPermission('shops.create');

        $this->actingAs($user)->postJson('/api/v1/shops', [
            'name' => 'Long Code Shop',
            'code' => 'LONG',
        ])->assertUnprocessable()->assertJsonValidationErrors('code');

        $this->assertDatabaseMissing('shops', ['name' => 'Long Code Shop']);
    }

    private function userWithPermission(string $name): User
    {
        $user = User::factory()->create();
        $permission = Permission::findOrCreate($name, 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);

        return $user;
    }
}
