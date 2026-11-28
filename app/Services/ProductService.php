<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(
        protected ProductRepositoryInterface $products,
        protected ProductImageService $images,
    ) {}

    public function all(?int $shopId = null, ?int $limit = null, bool $random = false): Collection
    {
        return $this->products->allForShop($shopId, $limit, $random);
    }

    public function list(?string $search = null, int $perPage = 15, ?int $categoryId = null, ?int $shopId = null): LengthAwarePaginator
    {
        return $this->products->search($search, $perPage, $categoryId, $shopId);
    }

    public function get(int $id): Product
    {
        return $this->products->findOrFail($id, ['*'], ['images']);
    }

    /**
     * Builds a unique product code: {ShopCode:5}{yy}{mm}{dd}{4 random digits}, with no separators.
     * Users without a shop (e.g. the super admin) get the "HQ" prefix.
     */
    public function generateSku(?int $shopId): string
    {
        $shopCode = ($shopId ? Shop::whereKey($shopId)->value('code') : null) ?? 'HQ';
        $cleanCode = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $shopCode));
        $prefix = Str::substr($cleanCode, 0, 5).now()->format('ymd');

        do {
            $sku = $prefix.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while ($this->products->skuExists($sku));

        return $sku;
    }

    public function create(array $data, string $shopCode): Product
    {
        $images = $data['images'] ?? [];
        unset($data['images'], $data['removed_image_ids']);

        if (empty($data['sku']) || $this->products->skuExists($data['sku'])) {
            $data['sku'] = $this->generateSku($data['created_by_shop_id'] ?? null);
        }

        return DB::transaction(function () use ($data, $images, $shopCode): Product {
            $product = $this->products->create($data);
            $this->images->attach($product, $shopCode, $images);

            return $product->load('images');
        });
    }

    public function update(int $id, array $data, string $shopCode): Product
    {
        $images = $data['images'] ?? [];
        $removedIds = $data['removed_image_ids'] ?? [];
        unset($data['images'], $data['removed_image_ids']);

        return DB::transaction(function () use ($id, $data, $images, $removedIds, $shopCode): Product {
            $product = $this->products->update($id, $data);
            $remaining = $product->images()->whereKeyNot($removedIds)->count();

            if ($remaining + count($images) > 10) {
                throw ValidationException::withMessages(['images' => ['A product can have at most 10 photos.']]);
            }

            $this->images->sync($product, $shopCode, $images, $removedIds);

            return $product->load('images');
        });
    }

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id): bool {
            $product = $this->products->findOrFail($id);
            $this->images->deleteAll($product);

            return $this->products->delete($id);
        });
    }
}
