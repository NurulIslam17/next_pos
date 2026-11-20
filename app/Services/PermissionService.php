<?php

namespace App\Services;

use App\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    public function __construct(protected PermissionRepositoryInterface $permissions) {}

    public function list(): Collection
    {
        return $this->permissions->all();
    }

    public function create(array $data): Permission
    {
        return $this->permissions->create(['name' => $data['name'], 'guard_name' => 'web']);
    }

    public function update(int $id, array $data): Permission
    {
        return $this->permissions->update($id, ['name' => $data['name']]);
    }

    public function delete(int $id): bool
    {
        return $this->permissions->delete($id);
    }
}
