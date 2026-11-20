<?php

namespace App\Repositories\Eloquent;

use App\Models\Purchase;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseRepository extends BaseRepository implements PurchaseRepositoryInterface
{
    public function __construct(Purchase $model)
    {
        parent::__construct($model);
    }

    public function paginatePurchases(int $perPage, ?string $search = null, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        return $this->model
            ->with(['supplier', 'shop', 'paymentType', 'creator', 'approver', 'items.product'])
            ->when($search, fn ($query) => $query->where(fn ($query) => $query
                ->whereLike('purchases.purchase_no', "%{$search}%")
                ->orWhereLike('purchases.reference_no', "%{$search}%")
                ->orWhereHas('supplier', fn ($query) => $query->whereLike('name', "%{$search}%"))))
            ->when($dateFrom, fn ($query) => $query->whereDate('purchases.purchase_date', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('purchases.purchase_date', '<=', $dateTo))
            ->latest()
            ->paginate($perPage);
    }

    public function numberExists(string $purchaseNo): bool
    {
        return $this->model->where('purchase_no', $purchaseNo)->exists();
    }
}
