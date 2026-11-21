<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ProductImageService
{
    public function __construct(protected ProductImage $images) {}

    public function attach(Product $product, string $shopCode, array $files, int $startOrder = 0): void
    {
        foreach ($files as $index => $file) {
            $path = $this->storeFile($file, $shopCode, $product->id);

            $product->images()->create([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'sort_order' => $startOrder + $index,
            ]);
        }
    }

    public function sync(Product $product, string $shopCode, array $files = [], array $removedIds = []): void
    {
        $removedImages = $product->images()->whereIn('id', $removedIds)->get();

        foreach ($removedImages as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }

        $nextOrder = (int) $product->images()->max('sort_order') + 1;

        $this->attach($product, $shopCode, $files, $nextOrder);
    }

    public function deleteAll(Product $product): void
    {
        $paths = $product->images()->pluck('path')->all();

        if ($paths !== []) {
            Storage::disk('public')->delete($paths);
        }

        $product->images()->delete();
    }

    private function storeFile(UploadedFile $file, string $shopCode, int $productId): string
    {
        $disk = Storage::disk('public');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $originalName = $this->sanitize(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $shopCode = $this->sanitize($shopCode);
        $fileSize = (int) $file->getSize();
        $timestamp = time();

        do {
            $fileName = "{$shopCode}_{$productId}_{$timestamp}_{$originalName}_{$fileSize}.{$extension}";
            $path = "products/{$fileName}";
            $timestamp++;
        } while ($disk->exists($path));

        $storedPath = $file->storeAs('products', $fileName, 'public');

        if ($storedPath === false) {
            throw new RuntimeException('Unable to store product photo.');
        }

        return $storedPath;
    }

    private function sanitize(string $value): string
    {
        $sanitized = trim((string) preg_replace('/[^A-Za-z0-9_-]+/', '_', $value), '_');

        return $sanitized === '' ? 'file' : $sanitized;
    }
}
