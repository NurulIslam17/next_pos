<?php

namespace App\Services;

use App\Models\Supplier;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SupplierService
{
    public function __construct(protected SupplierRepositoryInterface $suppliers) {}

    public function list(): Collection
    {
        return $this->suppliers->all();
    }

    public function create(array $data): Supplier
    {
        return $this->suppliers->create($data);
    }

    public function update(int $id, array $data): Supplier
    {
        return $this->suppliers->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->suppliers->delete($id);
    }
}
