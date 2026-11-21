<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerRepositoryInterface extends BaseRepositoryInterface
{
    public function search(?string $term, int $perPage = 10): LengthAwarePaginator;
}
