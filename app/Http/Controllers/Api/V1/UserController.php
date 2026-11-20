<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(protected UserService $users) {}

    public function index(Request $request): JsonResponse
    {
        return $this->paginated(UserResource::collection(
            $this->users->list($request->query('search'), (int) $request->query('per_page', 15))
        ));
    }

    public function show(int $user): JsonResponse
    {
        return $this->success(new UserResource($this->users->get($user)));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return $this->created(new UserResource($this->users->create($request->validated())), 'User created');
    }

    public function update(UpdateUserRequest $request, int $user): JsonResponse
    {
        return $this->success(new UserResource($this->users->update($user, $request->validated())), 'User updated');
    }

    public function destroy(Request $request, int $user): JsonResponse
    {
        $this->users->delete($user, $request->user());

        return $this->noContent();
    }
}
