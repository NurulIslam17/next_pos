<?php

namespace App\Services;

use App\Models\PaymentType;
use App\Repositories\Contracts\PaymentTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PaymentTypeService
{
    public function __construct(protected PaymentTypeRepositoryInterface $paymentTypes) {}

    public function list(): Collection
    {
        return $this->paymentTypes->all();
    }

    public function create(array $data): PaymentType
    {
        return $this->paymentTypes->create($data);
    }

    public function update(int $id, array $data): PaymentType
    {
        return $this->paymentTypes->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->paymentTypes->delete($id);
    }
}
