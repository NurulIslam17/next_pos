<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Services\RoleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(protected RoleService $roles) {}

    public function index(): JsonResponse
    {
        return $this->success(RoleResource::collection($this->roles->list()));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        return $this->created(new RoleResource($this->roles->create($request->validated())), 'Role created');
    }

    public function update(UpdateRoleRequest $request, int $role): JsonResponse
    {
        return $this->success(new RoleResource($this->roles->update($role, $request->validated())), 'Role updated');
    }

    public function destroy(int $role): JsonResponse
    {
        $this->roles->delete($role);

        return $this->noContent();
    }
}
