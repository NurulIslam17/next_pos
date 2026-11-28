<?php

namespace App\Repositories\Eloquent;

use App\Models\ManagerShopScope;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function skuExists(string $sku): bool
    {
        return $this->model->withoutGlobalScope(ManagerShopScope::class)->where('sku', $sku)->exists();
    }

    public function allForShop(?int $shopId = null, ?int $limit = null, bool $random = false): Collection
    {
        return $this->model
            ->with('images')
            ->when($shopId, fn ($q) => $q->where('created_by_shop_id', $shopId))
            ->when($random, fn ($q) => $q->inRandomOrder(), fn ($q) => $q->orderBy('name'))
            ->when($limit, fn ($q) => $q->limit($limit))
            ->get();
    }

    public function search(?string $term, int $perPage = 15, ?int $categoryId = null, ?int $shopId = null): LengthAwarePaginator
    {
        return $this->model
            ->with(['category', 'brand', 'supplier', 'createdByShop', 'images'])
            ->when($term, fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%")))
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($shopId, fn ($q) => $q->where('created_by_shop_id', $shopId))
            ->latest()
            ->paginate($perPage);
    }
}
