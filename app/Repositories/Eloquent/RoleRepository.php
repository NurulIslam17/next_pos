<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        $roles = $this->model->with(['permissions', ...$relations])->orderBy('id')->get($columns);
        $counts = $this->userCounts();

        // Spatie's Role::users() cannot resolve its model while the "sanctum" guard is active,
        // so the counts come straight from the pivot table.
        return $roles->each(fn (Role $role) => $role->setAttribute('users_count', $counts[$role->id] ?? 0));
    }

    public function hasUsers(int|string $id): bool
    {
        return DB::table(config('permission.table_names.model_has_roles'))->where('role_id', $id)->exists();
    }

    /** @return \Illuminate\Support\Collection<int, int> role id => number of users */
    private function userCounts()
    {
        return DB::table(config('permission.table_names.model_has_roles'))
            ->selectRaw('role_id, count(*) as total')
            ->groupBy('role_id')
            ->pluck('total', 'role_id');
    }
}
