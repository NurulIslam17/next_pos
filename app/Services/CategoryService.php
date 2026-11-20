<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(protected CategoryRepositoryInterface $categories) {}

    public function list(): Collection
    {
        return $this->categories->all();
    }

    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return $search ? $this->categories->search($search, $perPage) : $this->categories->paginate($perPage);
    }

    public function create(array $data): Category
    {
        return $this->categories->create($data);
    }

    public function update(int $id, array $data): Category
    {
        return $this->categories->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->categories->delete($id);
    }
}
