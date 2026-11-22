<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PurchaseRepositoryInterface extends BaseRepositoryInterface
{
    public function paginatePurchases(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null, ?string $status = null): LengthAwarePaginator;

    public function numberExists(string $purchaseNo): bool;
}
