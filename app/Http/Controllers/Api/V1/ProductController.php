<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Shop;
use App\Services\ProductService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponse;

    public function __construct(protected ProductService $products) {}

    public function index(Request $request): JsonResponse
    {
        $items = $this->products->list($request->query('search'), (int) $request->query('per_page', 10), $request->integer('category_id') ?: null, $request->integer('shop_id') ?: null);

        return $this->paginated(ProductResource::collection($items));
    }

    public function all(Request $request): JsonResponse
    {
        $shopId = $request->integer('shop_id') ?: null;
        $isAdmin = ! $request->user()->hasRole('manager');
        $limit = $isAdmin && ! $shopId ? 100 : null;

        return $this->success(ProductResource::collection($this->products->all($shopId, $limit, (bool) $limit)));
    }

    public function nextSku(Request $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request);

        return $this->success(['sku' => $this->products->generateSku($shopId)]);
    }

    public function show(int $product): JsonResponse
    {
        return $this->success(new ProductResource($this->products->get($product)));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request, $request->validated('created_by_shop_id'));

        return $this->created(new ProductResource($this->products->create([
            ...$request->validated(),
            'created_by_shop_id' => $shopId,
        ], $this->shopCode($shopId) ?? 'SHOP')), 'Product created');
    }

    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        return $this->success(new ProductResource($this->products->update($product, $request->validated(), $request->user()->shop?->code ?? 'SHOP')), 'Product updated');
    }

    public function destroy(int $product): JsonResponse
    {
        $this->products->delete($product);

        return $this->noContent();
    }

    private function resolveShopId(Request $request, ?int $submittedShopId = null): ?int
    {
        if ($request->user()->hasRole('manager')) {
            return $request->user()->shop_id;
        }

        if ($submittedShopId !== null) {
            return $submittedShopId ?: null;
        }

        return $request->integer('shop_id') ?: $request->user()->shop_id;
    }

    private function shopCode(?int $shopId): ?string
    {
        return $shopId ? Shop::whereKey($shopId)->value('code') : null;
    }
}
