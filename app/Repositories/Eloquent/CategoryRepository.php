<?php

namespace App\Repositories\Eloquent;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository extends BaseRepository implements CategoryRepositoryInterface
{
    public function __construct(Category $model)
    {
        parent::__construct($model);
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->with(['creator', ...$relations])->withCount('products')->orderBy('name')->get($columns);
    }

    public function paginate(int $perPage = 10, array $columns = ['*'], array $relations = []): LengthAwarePaginator
    {
        return $this->model->with(['creator', ...$relations])->withCount('products')->orderBy('name')->paginate($perPage, $columns);
    }

    public function search(?string $term, int $perPage = 10): LengthAwarePaginator
    {
        return $this->model
            ->with('creator')
            ->withCount('products')
            ->when($term, fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('description', 'like', "%{$term}%")))
            ->orderBy('name')
            ->paginate($perPage);
    }
}
