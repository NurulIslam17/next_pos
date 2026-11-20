<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\StoreShopRequest;
use App\Http\Requests\Shop\UpdateShopRequest;
use App\Http\Resources\ShopResource;
use App\Services\ShopService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ShopController extends Controller
{
    use ApiResponse;

    public function __construct(protected ShopService $shops) {}

    public function index(): JsonResponse
    {
        return $this->success(ShopResource::collection($this->shops->list()));
    }

    public function store(StoreShopRequest $request): JsonResponse
    {
        return $this->created(new ShopResource($this->shops->create($request->validated())), 'Shop created');
    }

    public function update(UpdateShopRequest $request, int $shop): JsonResponse
    {
        return $this->success(new ShopResource($this->shops->update($shop, $request->validated())), 'Shop updated');
    }

    public function destroy(int $shop): JsonResponse
    {
        $this->shops->delete($shop);

        return $this->noContent();
    }
}
