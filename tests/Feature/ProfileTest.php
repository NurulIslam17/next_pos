<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->postJson('/api/v1/profile', [
            '_method' => 'PUT',
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_updates_own_profile_and_stores_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
            'phone' => '111',
        ]);
        $photo = UploadedFile::fake()->image('my-face.jpg');

        $response = $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'name' => 'New Name',
            'email' => 'new@example.com',
            'phone' => '999',
            'nid_number' => 'NID-123',
            'date_of_birth' => '1990-05-12',
            'joining_date' => '2024-01-15',
            'bank_name' => 'Test Bank',
            'salary_account_name' => 'New Name',
            'salary_account_number' => 'ACC-001',
            'permanent_address' => 'Village Road',
            'present_address' => 'City Road',
            'photo' => $photo,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.phone', '999')
            ->assertJsonPath('data.nid_number', 'NID-123')
            ->assertJsonPath('data.date_of_birth', '1990-05-12')
            ->assertJsonPath('data.joining_date', '2024-01-15')
            ->assertJsonPath('data.bank_name', 'Test Bank')
            ->assertJsonPath('data.permanent_address', 'Village Road')
            ->assertJsonPath('data.present_address', 'City Road');

        $user->refresh();
        $this->assertSame('New Name', $user->name);
        $this->assertSame('new@example.com', $user->email);
        $this->assertSame('999', $user->phone);
        $this->assertSame('NID-123', $user->nid_number);
        $this->assertSame('1990-05-12', $user->date_of_birth->toDateString());
        $this->assertSame('2024-01-15', $user->joining_date->toDateString());
        $this->assertSame('Test Bank', $user->bank_name);
        $this->assertSame('New Name', $user->salary_account_name);
        $this->assertSame('ACC-001', $user->salary_account_number);
        $this->assertSame('Village Road', $user->permanent_address);
        $this->assertSame('City Road', $user->present_address);
        $this->assertNotNull($user->photo_path);
        $this->assertStringStartsWith('avatars/', $user->photo_path);
        $this->assertSame(Storage::url($user->photo_path), $response->json('data.photo_url'));
        Storage::disk('public')->assertExists($user->photo_path);
    }

    public function test_replaces_and_removes_profile_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $first = UploadedFile::fake()->image('first.jpg');

        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'photo' => $first,
        ])->assertOk();

        $oldPath = $user->fresh()->photo_path;
        Storage::disk('public')->assertExists($oldPath);

        $replacement = UploadedFile::fake()->image('replacement.png');
        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'photo' => $replacement,
        ])->assertOk();

        $newPath = $user->fresh()->photo_path;
        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);

        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'remove_photo' => true,
        ])->assertOk()->assertJsonPath('data.photo_url', null);

        $this->assertNull($user->fresh()->photo_path);
        Storage::disk('public')->assertMissing($newPath);
    }

    public function test_rejects_non_image_photo_upload(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'photo' => UploadedFile::fake()->create('notes.txt', 10),
        ])->assertUnprocessable()->assertJsonValidationErrors('photo');

        $this->assertNull($user->fresh()->photo_path);
        Storage::disk('public')->assertEmpty('avatars');
    }

    public function test_rejects_nid_number_used_by_another_user(): void
    {
        $user = User::factory()->create();
        User::factory()->create(['nid_number' => 'NID-USED']);

        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'nid_number' => 'NID-USED',
        ])->assertUnprocessable()->assertJsonValidationErrors('nid_number');

        $this->assertNull($user->fresh()->nid_number);
    }

    public function test_ignores_fields_the_user_must_not_update(): void
    {
        $user = User::factory()->create(['is_active' => true, 'salary' => '5000.00']);
        $otherShop = Shop::create(['name' => 'Other Shop', 'code' => 'OTHER']);
        $otherUser = User::factory()->create(['shop_id' => $otherShop->id]);
        Role::findOrCreate('super_admin', 'web');

        $this->actingAs($user)->post('/api/v1/profile', [
            '_method' => 'PUT',
            'name' => 'Safe Name',
            'shop_id' => $otherShop->id,
            'salary' => '999999.00',
            'is_active' => false,
            'roles' => ['super_admin'],
            'user_id' => $otherUser->id,
        ])->assertOk();

        $user->refresh();
        $this->assertSame('Safe Name', $user->name);
        $this->assertNull($user->shop_id);
        $this->assertSame('5000.00', $user->salary);
        $this->assertTrue($user->is_active);
        $this->assertFalse($user->hasRole('super_admin'));
        $this->assertSame($otherShop->id, $otherUser->fresh()->shop_id);
    }
}
