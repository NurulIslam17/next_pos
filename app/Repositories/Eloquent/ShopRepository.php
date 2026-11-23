<?php

namespace App\Repositories\Eloquent;

use App\Models\Shop;
use App\Repositories\Contracts\ShopRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ShopRepository extends BaseRepository implements ShopRepositoryInterface
{
    public function __construct(Shop $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->with(['manager', ...$relations])->withCount('users')->orderBy('id')->get($columns);
    }

    public function names(): Collection
    {
        return $this->model->query()->orderBy('name')->get(['id', 'name', 'code']);
    }
}
