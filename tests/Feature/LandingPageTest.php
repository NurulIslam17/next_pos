<?php

namespace Tests\Feature;

use App\Models\LandingPage;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_returns_published_landing_page_content(): void
    {
        $landingPage = LandingPage::factory()->create([
            'brand_name' => 'Test POS',
            'hero_title' => 'Built for your shops',
            'features' => [
                ['title' => 'Fast checkout', 'description' => 'Bill customers quickly.'],
            ],
        ]);

        $response = $this->getJson('/api/v1/landing-page');

        $response->assertOk()
            ->assertJsonPath('data.brand_name', 'Test POS')
            ->assertJsonPath('data.hero_title', 'Built for your shops')
            ->assertJsonPath('data.features.0.title', 'Fast checkout')
            ->assertJsonCount(1, 'data.features');
    }

    public function test_public_endpoint_returns_404_when_landing_page_is_unpublished(): void
    {
        LandingPage::factory()->create(['is_published' => false]);

        $this->getJson('/api/v1/landing-page')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_public_shops_endpoint_returns_all_shop_names(): void
    {
        Shop::query()->create(['name' => 'Sylhet Central', 'code' => 'SYL', 'is_active' => true]);
        Shop::query()->create(['name' => 'Dhaka North', 'code' => 'DHK', 'is_active' => false]);

        $this->getJson('/api/v1/landing-page/shops')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Dhaka North')
            ->assertJsonPath('data.1.name', 'Sylhet Central');
    }

    public function test_settings_endpoint_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/landing-page/settings')->assertUnauthorized();
    }

    public function test_settings_endpoint_forbids_user_without_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/v1/landing-page/settings')->assertForbidden();
    }

    public function test_settings_endpoint_returns_content_for_user_with_view_permission(): void
    {
        $user = $this->userWithPermissions(['landing_page.view']);
        $landingPage = LandingPage::factory()->create(['hero_title' => 'Admin controlled hero']);

        $this->actingAs($user)->getJson('/api/v1/landing-page/settings')
            ->assertOk()
            ->assertJsonPath('data.hero_title', 'Admin controlled hero')
            ->assertJsonPath('data.id', $landingPage->id);
    }

    public function test_update_endpoint_forbids_user_with_update_permission_missing(): void
    {
        $user = $this->userWithPermissions(['landing_page.view']);

        $this->actingAs($user)->putJson('/api/v1/landing-page', LandingPage::defaultContent())
            ->assertForbidden();
    }

    public function test_update_rejects_unsafe_primary_call_to_action_url(): void
    {
        $user = $this->userWithPermissions(['landing_page.update']);
        LandingPage::factory()->create();

        $this->actingAs($user)->putJson('/api/v1/landing-page', [
            ...LandingPage::defaultContent(),
            'primary_cta_url' => 'javascript:alert(1)',
        ])->assertUnprocessable()->assertJsonValidationErrors('primary_cta_url');
    }

    public function test_update_rejects_feature_without_description(): void
    {
        $user = $this->userWithPermissions(['landing_page.update']);
        LandingPage::factory()->create();

        $this->actingAs($user)->putJson('/api/v1/landing-page', [
            ...LandingPage::defaultContent(),
            'features' => [['title' => 'Missing description']],
        ])->assertUnprocessable()->assertJsonValidationErrors('features.0.description');
    }

    public function test_update_persists_content_and_ignores_created_by_payload(): void
    {
        $creator = User::factory()->create();
        $user = $this->userWithPermissions(['landing_page.update']);
        $landingPage = LandingPage::factory()->create([
            'created_by' => $creator->id,
            'brand_name' => 'Old Brand',
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/landing-page', [
            ...LandingPage::defaultContent(),
            'brand_name' => 'New Brand',
            'hero_title' => 'New hero title',
            'created_by' => $user->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.brand_name', 'New Brand')
            ->assertJsonPath('data.hero_title', 'New hero title');
        $this->assertDatabaseHas('landing_pages', [
            'id' => $landingPage->id,
            'brand_name' => 'New Brand',
            'hero_title' => 'New hero title',
            'created_by' => $creator->id,
        ]);
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
