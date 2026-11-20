<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function __construct(protected UserRepositoryInterface $users) {}

    public function list(?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->users->search($search, $perPage);
    }

    public function get(int $id): User
    {
        return $this->users->findOrFail($id, relations: ['shop', 'roles']);
    }

    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $roles = $data['roles'] ?? [];
            unset($data['roles']);

            /** @var User $user */
            $user = $this->users->create($data);
            $user->syncRoles($roles);

            return $user->load(['shop', 'roles']);
        });
    }

    public function update(int $id, array $data): User
    {
        return DB::transaction(function () use ($id, $data) {
            $roles = $data['roles'] ?? null;
            unset($data['roles']);

            if (empty($data['password'])) {
                unset($data['password']);
            }

            /** @var User $user */
            $user = $this->users->update($id, $data);

            if ($roles !== null) {
                $this->guardLastSuperAdmin($user, $roles);
                $user->syncRoles($roles);
            }

            return $user->load(['shop', 'roles']);
        });
    }

    public function delete(int $id, User $actor): bool
    {
        if ($actor->id === $id) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }

        return $this->users->delete($id);
    }

    /** Prevent removing the super_admin role from the only super admin. */
    private function guardLastSuperAdmin(User $user, array $newRoles): void
    {
        if ($user->hasRole('super_admin') && ! in_array('super_admin', $newRoles, true)
            && User::role('super_admin')->count() <= 1) {
            throw ValidationException::withMessages(['roles' => ['At least one super admin must remain.']]);
        }
    }
}
