<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Brand\StoreBrandRequest;
use App\Http\Requests\Brand\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Services\BrandService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BrandController extends Controller
{
    use ApiResponse;

    public function __construct(protected BrandService $brands) {}

    public function index(): JsonResponse
    {
        return $this->success(BrandResource::collection($this->brands->list()));
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        return $this->created(new BrandResource($this->brands->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ])), 'Brand created');
    }

    public function update(UpdateBrandRequest $request, int $brand): JsonResponse
    {
        return $this->success(new BrandResource($this->brands->update($brand, $request->validated())), 'Brand updated');
    }

    public function destroy(int $brand): JsonResponse
    {
        $this->brands->delete($brand);

        return $this->noContent();
    }
}
