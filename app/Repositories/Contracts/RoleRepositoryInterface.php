<?php

namespace App\Repositories\Contracts;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    public function hasUsers(int|string $id): bool;
}
