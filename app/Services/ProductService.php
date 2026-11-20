<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct(protected ProductRepositoryInterface $products) {}

    public function all(?int $shopId = null): Collection
    {
        return $this->products->allForShop($shopId);
    }

    public function list(?string $search = null, int $perPage = 15, ?int $categoryId = null, ?int $shopId = null): LengthAwarePaginator
    {
        return $this->products->search($search, $perPage, $categoryId, $shopId);
    }

    public function get(int $id): Product
    {
        return $this->products->findOrFail($id);
    }

    /**
     * Builds a unique product code: {ShopCode}{yy}{mm}{dd}{4 random digits}, with no separators,
     * e.g. SHOP03 + 261116 + 4827 = SHOP032611164827.
     * Users without a shop (e.g. the super admin) get the "HQ" prefix.
     */
    public function generateSku(?int $shopId): string
    {
        $shopCode = ($shopId ? Shop::whereKey($shopId)->value('code') : null) ?? 'HQ';
        $prefix = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $shopCode)).now()->format('ymd');

        do {
            $sku = $prefix.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while ($this->products->skuExists($sku));

        return $sku;
    }

    public function create(array $data): Product
    {
        // Keep the previewed code when it is still free; otherwise issue a fresh one.
        if (empty($data['sku']) || $this->products->skuExists($data['sku'])) {
            $data['sku'] = $this->generateSku($data['created_by_shop_id'] ?? null);
        }

        return DB::transaction(fn () => $this->products->create($data));
    }

    public function update(int $id, array $data): Product
    {
        return DB::transaction(fn () => $this->products->update($id, $data));
    }

    public function delete(int $id): bool
    {
        return $this->products->delete($id);
    }
}
