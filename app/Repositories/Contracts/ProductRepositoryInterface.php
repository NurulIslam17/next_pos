<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ProductRepositoryInterface extends BaseRepositoryInterface
{
    public function skuExists(string $sku): bool;

    public function allForShop(?int $shopId = null): Collection;

    public function search(?string $term, int $perPage = 15, ?int $categoryId = null, ?int $shopId = null): LengthAwarePaginator;
}
