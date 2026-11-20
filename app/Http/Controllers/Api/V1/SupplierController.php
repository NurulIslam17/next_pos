<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Services\SupplierService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    use ApiResponse;

    public function __construct(protected SupplierService $suppliers) {}

    public function index(): JsonResponse
    {
        return $this->success(SupplierResource::collection($this->suppliers->list()));
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        return $this->created(new SupplierResource($this->suppliers->create($request->validated())), 'Supplier created');
    }

    public function update(UpdateSupplierRequest $request, int $supplier): JsonResponse
    {
        return $this->success(new SupplierResource($this->suppliers->update($supplier, $request->validated())), 'Supplier updated');
    }

    public function destroy(int $supplier): JsonResponse
    {
        $this->suppliers->delete($supplier);

        return $this->noContent();
    }
}
