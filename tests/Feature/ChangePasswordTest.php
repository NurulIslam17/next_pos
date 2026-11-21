<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->postJson('/api/v1/profile/change-password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertUnauthorized();
    }

    public function test_changes_own_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);
        $oldHash = $user->password;

        $this->actingAs($user)->postJson('/api/v1/profile/change-password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk()->assertJsonPath('message', 'Password changed');

        $user->refresh();
        $this->assertNotSame($oldHash, $user->password);
        $this->assertTrue(Hash::check('new-password', $user->password));
        $this->assertFalse(Hash::check('old-password', $user->password));
    }

    public function test_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->postJson('/api/v1/profile/change-password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_requires_password_confirmation(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->postJson('/api/v1/profile/change-password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }
}
