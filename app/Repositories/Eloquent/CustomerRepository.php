<?php

namespace App\Repositories\Eloquent;

use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CustomerRepository extends BaseRepository implements CustomerRepositoryInterface
{
    public function __construct(Customer $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->with(['creator', ...$relations])->latest()->get($columns);
    }

    public function search(?string $term, int $perPage = 10): LengthAwarePaginator
    {
        return $this->model
            ->with('creator')
            ->when($term, fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('address', 'like', "%{$term}%")))
            ->latest()
            ->paginate($perPage);
    }
}
