<?php

namespace App\Repositories\Eloquent;

use App\Models\PaymentType;
use App\Repositories\Contracts\PaymentTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PaymentTypeRepository extends BaseRepository implements PaymentTypeRepositoryInterface
{
    public function __construct(PaymentType $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->with(['creator', ...$relations])->orderBy('name')->get($columns);
    }
}
