<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ManagerExpenseShopScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user instanceof User && $user->hasRole('manager')) {
            $builder->where($model->qualifyColumn('shop_id'), $user->shop_id ?? -1);
        }
    }
}
