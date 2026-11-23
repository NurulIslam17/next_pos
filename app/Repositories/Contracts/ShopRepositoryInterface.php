<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface ShopRepositoryInterface extends BaseRepositoryInterface
{
    public function names(): Collection;
}
