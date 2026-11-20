<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function __construct(protected CategoryService $categories) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 100);

        $search = $request->query('search');

        return $this->paginated(CategoryResource::collection($this->categories->paginate($perPage, is_string($search) ? $search : null)));
    }

    public function all(): JsonResponse
    {
        return $this->success(CategoryResource::collection($this->categories->list()));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        return $this->created(new CategoryResource($this->categories->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ])), 'Category created');
    }

    public function update(UpdateCategoryRequest $request, int $category): JsonResponse
    {
        return $this->success(new CategoryResource($this->categories->update($category, $request->validated())), 'Category updated');
    }

    public function destroy(int $category): JsonResponse
    {
        $this->categories->delete($category);

        return $this->noContent();
    }
}
