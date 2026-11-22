<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SaleRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateSales(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator;

    public function numberExists(string $saleNo): bool;
}
