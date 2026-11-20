<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(protected UserRepositoryInterface $users) {}

    public function register(array $data): array
    {
        /** @var User $user */
        $user = $this->users->create($data);

        return ['user' => $user, 'token' => $user->createToken('api')->plainTextToken];
    }

    public function login(array $credentials): array
    {
        $user = $this->users->findByEmail($credentials['email']);

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }

        return ['user' => $user, 'token' => $user->createToken('api')->plainTextToken];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
