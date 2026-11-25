<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_grants_supplier_creation_to_manager_role(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->assertTrue(Role::findByName('manager', 'web')->hasPermissionTo('suppliers.create'));
    }

    public function test_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/suppliers')->assertUnauthorized();
    }

    public function test_forbids_user_without_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/suppliers', ['name' => 'Supplier'])
            ->assertForbidden();
    }

    public function test_manager_role_can_create_suppliers(): void
    {
        $this->seed(PermissionSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('manager');

        $this->assertTrue($user->can('suppliers.create'));
        $this->actingAs($user)->postJson('/api/v1/suppliers', ['name' => 'Manager Supplier'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Manager Supplier');

        $this->assertDatabaseHas('suppliers', ['name' => 'Manager Supplier']);
    }
}
