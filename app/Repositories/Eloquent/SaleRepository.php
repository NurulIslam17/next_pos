<?php

namespace App\Repositories\Eloquent;

use App\Models\Sale;
use App\Repositories\Contracts\SaleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SaleRepository extends BaseRepository implements SaleRepositoryInterface
{
    public function __construct(Sale $model)
    {
        parent::__construct($model);
    }

    public function paginateSales(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        return $this->model
            ->with(['customer', 'shop', 'paymentType', 'creator', 'items.product'])
            ->when($search, fn ($query) => $query->where(fn ($query) => $query
                ->whereLike('sales.sale_no', "%{$search}%")
                ->orWhereLike('sales.reference_no', "%{$search}%")
                ->orWhereHas('customer', fn ($query) => $query->whereLike('name', "%{$search}%"))))
            ->when($dateFrom, fn ($query) => $query->whereDate('sales.sale_date', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('sales.sale_date', '<=', $dateTo))
            ->latest()
            ->paginate($perPage);
    }

    public function numberExists(string $saleNo): bool
    {
        return $this->model->where('sale_no', $saleNo)->exists();
    }
}
