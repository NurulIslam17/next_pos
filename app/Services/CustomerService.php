<?php

namespace App\Services;

use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    public function __construct(protected CustomerRepositoryInterface $customers) {}

    public function list(?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        return $this->customers->search($search, $perPage);
    }

    /** @return Collection<int, Customer> */
    public function all(): Collection
    {
        return $this->customers->all();
    }

    public function create(array $data): Customer
    {
        return $this->customers->create($data);
    }

    public function update(int $id, array $data): Customer
    {
        return $this->customers->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->customers->delete($id);
    }
}
