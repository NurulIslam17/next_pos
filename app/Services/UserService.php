<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

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

    public function updateProfile(User $user, array $data, ?UploadedFile $photo = null, bool $removePhoto = false): User
    {
        $oldPath = $user->photo_path;
        $newPath = null;

        if ($photo !== null) {
            $newPath = $this->storePhoto($photo, $user->id);
            $data['photo_path'] = $newPath;
        } elseif ($removePhoto) {
            $data['photo_path'] = null;
        }

        try {
            $user->update($data);
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        if (($photo !== null || $removePhoto) && $oldPath !== null && $oldPath !== $newPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return $user->load(['shop', 'roles']);
    }

    public function changePassword(User $user, string $newPassword): User
    {
        $user->update(['password' => $newPassword]);

        return $user;
    }

    public function delete(int $id, User $actor): bool
    {
        if ($actor->id === $id) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }

        return $this->users->delete($id);
    }

    private function storePhoto(UploadedFile $photo, int $userId): string
    {
        $disk = Storage::disk('public');
        $extension = strtolower($photo->getClientOriginalExtension() ?: $photo->guessExtension() ?: 'jpg');
        $originalName = trim((string) preg_replace('/[^A-Za-z0-9_-]+/', '_', pathinfo($photo->getClientOriginalName(), PATHINFO_FILENAME)), '_') ?: 'photo';
        $fileSize = (int) $photo->getSize();
        $timestamp = time();

        do {
            $fileName = "{$userId}_{$timestamp}_{$originalName}_{$fileSize}.{$extension}";
            $path = "avatars/{$fileName}";
            $timestamp++;
        } while ($disk->exists($path));

        $storedPath = $photo->storeAs('avatars', $fileName, 'public');

        if ($storedPath === false) {
            throw new RuntimeException('Unable to store profile photo.');
        }

        return $storedPath;
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
