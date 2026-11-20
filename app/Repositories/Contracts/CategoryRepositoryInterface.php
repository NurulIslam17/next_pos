<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CategoryRepositoryInterface extends BaseRepositoryInterface
{
    public function search(?string $term, int $perPage = 10): LengthAwarePaginator;
}
