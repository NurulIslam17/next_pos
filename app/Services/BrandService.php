<?php

namespace App\Services;

use App\Models\Brand;
use App\Repositories\Contracts\BrandRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BrandService
{
    public function __construct(protected BrandRepositoryInterface $brands) {}

    public function list(): Collection
    {
        return $this->brands->all();
    }

    public function create(array $data): Brand
    {
        return $this->brands->create($data);
    }

    public function update(int $id, array $data): Brand
    {
        return $this->brands->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->brands->delete($id);
    }
}
