<?php

namespace App\Services;

use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RoleService
{
    public const PROTECTED_ROLE = 'super_admin';

    public function __construct(protected RoleRepositoryInterface $roles) {}

    public function list(): Collection
    {
        return $this->roles->all();
    }

    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data) {
            /** @var Role $role */
            $role = $this->roles->create(['name' => $data['name'], 'guard_name' => 'web']);
            $role->syncPermissions($data['permissions'] ?? []);

            return $role->load('permissions');
        });
    }

    public function update(int $id, array $data): Role
    {
        $role = $this->roles->findOrFail($id);
        $this->guardProtected($role);

        return DB::transaction(function () use ($role, $data) {
            $role->update(['name' => $data['name']]);
            $role->syncPermissions($data['permissions'] ?? []);

            return $role->load('permissions');
        });
    }

    public function delete(int $id): bool
    {
        $role = $this->roles->findOrFail($id);
        $this->guardProtected($role);

        if ($this->roles->hasUsers($id)) {
            throw ValidationException::withMessages(['role' => ['This role is still assigned to users.']]);
        }

        return $this->roles->delete($id);
    }

    private function guardProtected(Role $role): void
    {
        if ($role->name === self::PROTECTED_ROLE) {
            throw ValidationException::withMessages(['role' => ['The super admin role cannot be modified.']]);
        }
    }
}
