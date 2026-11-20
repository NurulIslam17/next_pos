<?php

namespace Tests\Feature;

use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PaymentTypeTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/payment-types')->assertUnauthorized();
    }

    public function test_forbids_user_without_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/payment-types')->assertForbidden();
    }

    public function test_lists_payment_types(): void
    {
        $user = $this->userWithPermissions(['payment_types.view']);
        $paymentType = PaymentType::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/payment-types');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $paymentType->id)
            ->assertJsonPath('data.0.code', $paymentType->code);
    }

    public function test_creates_payment_type_and_normalizes_code(): void
    {
        $user = $this->userWithPermissions(['payment_types.create']);

        $response = $this->actingAs($user)->postJson('/api/v1/payment-types', [
            'name' => 'Mobile Wallet',
            'code' => 'wallet',
            'description' => 'Wallet payments.',
            'status' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'WALLET');
        $this->assertDatabaseHas('payment_types', ['name' => 'Mobile Wallet', 'code' => 'WALLET']);
    }

    public function test_rejects_duplicate_code(): void
    {
        $user = $this->userWithPermissions(['payment_types.create']);
        PaymentType::factory()->create(['code' => 'CASH']);

        $this->actingAs($user)->postJson('/api/v1/payment-types', [
            'name' => 'Cash Duplicate',
            'code' => 'cash',
        ])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_updates_payment_type(): void
    {
        $user = $this->userWithPermissions(['payment_types.update']);
        $paymentType = PaymentType::factory()->create(['name' => 'Card', 'code' => 'CARD']);

        $response = $this->actingAs($user)->putJson("/api/v1/payment-types/{$paymentType->id}", [
            'name' => 'Debit Card',
            'code' => 'dc',
            'status' => false,
        ]);

        $response->assertOk()->assertJsonPath('data.code', 'DC');
        $this->assertDatabaseHas('payment_types', ['id' => $paymentType->id, 'name' => 'Debit Card', 'code' => 'DC', 'status' => false]);
    }

    public function test_deletes_payment_type(): void
    {
        $user = $this->userWithPermissions(['payment_types.delete']);
        $paymentType = PaymentType::factory()->create();

        $this->actingAs($user)->deleteJson("/api/v1/payment-types/{$paymentType->id}")->assertNoContent();

        $this->assertModelMissing($paymentType);
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
