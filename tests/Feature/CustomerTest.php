<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Database\Seeders\CustomerSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/customers')->assertUnauthorized();
    }

    public function test_forbids_user_without_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/customers')->assertForbidden();
    }

    public function test_lists_customers(): void
    {
        $user = $this->userWithPermissions(['customers.view']);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonPath('data.0.id', $customer->id)
            ->assertJsonPath('data.0.name', $customer->name)
            ->assertJsonPath('data.0.created_by', $user->id)
            ->assertJsonPath('data.0.created_by_name', $user->name)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 10);
    }

    public function test_lists_latest_customers_first(): void
    {
        $user = $this->userWithPermissions(['customers.view']);
        Customer::factory()->create(['name' => 'Oldest Customer', 'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)]);
        Customer::factory()->create(['name' => 'Newest Customer', 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($user)->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Newest Customer')
            ->assertJsonPath('data.1.name', 'Oldest Customer');
    }

    public function test_searches_customers_by_name_phone_and_address(): void
    {
        $user = $this->userWithPermissions(['customers.view']);
        Customer::factory()->create(['name' => 'Alpha Store', 'phone' => '01711111111', 'address' => 'Dhaka']);
        Customer::factory()->create(['name' => 'Beta Shop', 'phone' => '01822222222', 'address' => 'Sylhet']);

        $this->actingAs($user)->getJson('/api/v1/customers?search=Alpha')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Store');

        $this->actingAs($user)->getJson('/api/v1/customers?search=01822222222')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Beta Shop');

        $this->actingAs($user)->getJson('/api/v1/customers?search=Sylhet')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Beta Shop');
    }

    public function test_paginates_customers(): void
    {
        $user = $this->userWithPermissions(['customers.view']);
        Customer::factory()->count(3)->create();

        $this->actingAs($user)->getJson('/api/v1/customers?per_page=2&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_creates_customer(): void
    {
        $user = $this->userWithPermissions(['customers.create']);

        $this->actingAs($user)->postJson('/api/v1/customers', [
            'name' => 'New Customer',
            'phone' => '01700000000',
            'address' => 'Dhaka',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'New Customer')
            ->assertJsonPath('data.created_by', $user->id);

        $this->assertDatabaseHas('customers', [
            'name' => 'New Customer',
            'phone' => '01700000000',
            'address' => 'Dhaka',
            'created_by' => $user->id,
        ]);
    }

    public function test_rejects_duplicate_name(): void
    {
        $user = $this->userWithPermissions(['customers.create']);
        Customer::factory()->create(['name' => 'Existing Customer']);

        $this->actingAs($user)->postJson('/api/v1/customers', [
            'name' => 'Existing Customer',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_updates_customer(): void
    {
        $user = $this->userWithPermissions(['customers.update']);
        $customer = Customer::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->putJson("/api/v1/customers/{$customer->id}", [
            'name' => 'Updated Name',
            'phone' => '01800000000',
            'address' => 'Chattogram',
        ])->assertOk()->assertJsonPath('data.name', 'Updated Name');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'Updated Name',
            'phone' => '01800000000',
            'address' => 'Chattogram',
        ]);
    }

    public function test_deletes_customer(): void
    {
        $user = $this->userWithPermissions(['customers.delete']);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->deleteJson("/api/v1/customers/{$customer->id}")->assertNoContent();

        $this->assertModelMissing($customer);
    }

    public function test_manager_role_can_create_customers(): void
    {
        $this->seed(PermissionSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('manager');

        $this->assertTrue($user->can('customers.create'));
        $this->actingAs($user)->postJson('/api/v1/customers', ['name' => 'Manager Customer'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Manager Customer')
            ->assertJsonPath('data.created_by', $user->id);
    }

    public function test_seeder_loads_customer_names_from_sales_report(): void
    {
        $creator = User::factory()->create();
        $this->seed(CustomerSeeder::class);

        $this->assertSame(455, Customer::query()->count());
        $this->assertDatabaseHas('customers', ['name' => 'Walk-in Customer', 'phone' => null, 'address' => null, 'created_by' => $creator->id]);
        $this->assertDatabaseHas('customers', ['name' => 'Shaon', 'phone' => null, 'address' => null, 'created_by' => $creator->id]);
    }

    /** @param list<string> $names */
    private function userWithPermissions(array $names): User
    {
        $user = User::factory()->create();
        $permissions = collect($names)->map(fn (string $name): Permission => Permission::findOrCreate($name, 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permissions);

        return $user;
    }
}
