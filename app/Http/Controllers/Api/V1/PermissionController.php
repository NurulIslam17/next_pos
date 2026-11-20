<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\PermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Services\PermissionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    use ApiResponse;

    public function __construct(protected PermissionService $permissions) {}

    public function index(): JsonResponse
    {
        return $this->success(PermissionResource::collection($this->permissions->list()));
    }

    public function store(PermissionRequest $request): JsonResponse
    {
        return $this->created(new PermissionResource($this->permissions->create($request->validated())), 'Permission created');
    }

    public function update(PermissionRequest $request, int $permission): JsonResponse
    {
        return $this->success(new PermissionResource($this->permissions->update($permission, $request->validated())), 'Permission updated');
    }

    public function destroy(int $permission): JsonResponse
    {
        $this->permissions->delete($permission);

        return $this->noContent();
    }
}
