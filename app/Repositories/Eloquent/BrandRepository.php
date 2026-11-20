<?php

namespace App\Repositories\Eloquent;

use App\Models\Brand;
use App\Repositories\Contracts\BrandRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BrandRepository extends BaseRepository implements BrandRepositoryInterface
{
    public function __construct(Brand $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->with(['creator', ...$relations])->orderBy('name')->get($columns);
    }
}
