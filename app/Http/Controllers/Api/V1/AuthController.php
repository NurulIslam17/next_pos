<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(protected AuthService $auth) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register($request->validated());

        return $this->created([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 'Registered successfully');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login($request->validated());

        return $this->success([
            'user' => (new UserResource($result['user']->load('shop')))->withPermissions(),
            'token' => $result['token'],
        ], 'Logged in successfully');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success((new UserResource($request->user()->load('shop')))->withPermissions());
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return $this->success(null, 'Logged out successfully');
    }
}
