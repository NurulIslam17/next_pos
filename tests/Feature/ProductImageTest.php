<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_stores_multiple_product_photos(): void
    {
        Storage::fake('public');
        $user = $this->userWithProductPermissions();
        $front = UploadedFile::fake()->image('front.jpg');
        $back = UploadedFile::fake()->image('back.png');

        $response = $this->actingAs($user)->post('/api/v1/products', [
            'name' => 'Camera',
            'sku' => 'CAM-1',
            'price' => 100,
            'images' => [$front, $back],
        ]);

        $response->assertCreated()
            ->assertJsonCount(2, 'data.images')
            ->assertJsonPath('data.images.0.original_name', 'front.jpg')
            ->assertJsonPath('data.images.1.original_name', 'back.png');

        $product = Product::where('sku', 'CAM-1')->firstOrFail();
        $paths = $product->images->pluck('path')->all();

        $this->assertCount(2, $product->images);
        $this->assertGeneratedFileName($user, $product, $product->images[0]->path, $front);
        $this->assertGeneratedFileName($user, $product, $product->images[1]->path, $back);
        Storage::disk('public')->assertExists($paths);
        Storage::disk('public')->assertCount('products', 2, true);
    }

    public function test_rejects_non_image_uploads(): void
    {
        Storage::fake('public');
        $user = $this->userWithProductPermissions();

        $this->actingAs($user)->post('/api/v1/products', [
            'name' => 'Camera',
            'sku' => 'CAM-2',
            'price' => 100,
            'images' => [UploadedFile::fake()->create('notes.txt', 10)],
        ])->assertUnprocessable()->assertJsonValidationErrors(['images.0']);

        Storage::disk('public')->assertEmpty('products');
        $this->assertDatabaseMissing('products', ['sku' => 'CAM-2']);
    }

    public function test_update_can_remove_and_add_photos(): void
    {
        Storage::fake('public');
        $user = $this->userWithProductPermissions();
        $product = Product::create(['name' => 'Camera', 'sku' => 'CAM-3', 'price' => 100]);
        $removed = $product->images()->create([
            'path' => 'products/removed.jpg',
            'original_name' => 'removed.jpg',
            'sort_order' => 0,
        ]);
        $kept = $product->images()->create([
            'path' => 'products/kept.jpg',
            'original_name' => 'kept.jpg',
            'sort_order' => 1,
        ]);
        Storage::disk('public')->put($removed->path, 'removed');
        Storage::disk('public')->put($kept->path, 'kept');
        $newFile = UploadedFile::fake()->image('new.jpg');

        $response = $this->actingAs($user)->post("/api/v1/products/{$product->id}", [
            '_method' => 'PUT',
            'name' => 'Camera updated',
            'removed_image_ids' => [$removed->id],
            'images' => [$newFile],
        ]);

        $response->assertOk()->assertJsonCount(2, 'data.images');
        $this->assertDatabaseMissing('product_images', ['id' => $removed->id]);
        $this->assertDatabaseHas('product_images', ['id' => $kept->id]);
        $newImage = $product->images()->where('original_name', 'new.jpg')->firstOrFail();
        $this->assertGeneratedFileName($user, $product, $newImage->path, $newFile);
        Storage::disk('public')->assertMissing($removed->path);
        Storage::disk('public')->assertExists($kept->path);
        Storage::disk('public')->assertExists($product->images()->pluck('path')->all());
    }

    public function test_deleting_product_removes_photo_files(): void
    {
        Storage::fake('public');
        $user = $this->userWithProductPermissions();
        $product = Product::create(['name' => 'Camera', 'sku' => 'CAM-4', 'price' => 100]);
        $image = $product->images()->create([
            'path' => 'products/delete.jpg',
            'original_name' => 'delete.jpg',
            'sort_order' => 0,
        ]);
        Storage::disk('public')->put($image->path, 'delete');

        $this->actingAs($user)->delete("/api/v1/products/{$product->id}")->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing($image->path);
    }

    private function assertGeneratedFileName(User $user, Product $product, string $path, UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $pattern = '/^'.$user->shop->code.'_'.$product->id.'_\d+_'.$originalName.'_'.$file->getSize().'\.'.$extension.'$/';

        $this->assertStringStartsWith('products/', $path);
        $this->assertMatchesRegularExpression($pattern, basename($path));
    }

    private function userWithProductPermissions(): User
    {
        $shop = Shop::create(['name' => 'Test Shop', 'code' => 'SHOP1']);
        $user = User::factory()->create(['shop_id' => $shop->id]);
        $permissions = collect(['products.view', 'products.create', 'products.update', 'products.delete'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permissions);

        return $user;
    }
}
