<?php

namespace App\Services;

use App\Models\Shop;
use App\Repositories\Contracts\ShopRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ShopService
{
    public function __construct(protected ShopRepositoryInterface $shops) {}

    public function list(): Collection
    {
        return $this->shops->all();
    }

    public function names(): Collection
    {
        return $this->shops->names();
    }

    public function create(array $data): Shop
    {
        return $this->shops->create($data);
    }

    public function update(int $id, array $data): Shop
    {
        return $this->shops->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->shops->delete($id);
    }
}
