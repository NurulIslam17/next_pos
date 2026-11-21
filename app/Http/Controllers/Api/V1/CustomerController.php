<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use ApiResponse;

    public function __construct(protected CustomerService $customers) {}

    public function index(Request $request): JsonResponse
    {
        return $this->paginated(CustomerResource::collection(
            $this->customers->list($request->query('search'), (int) $request->query('per_page', 10))
        ));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        return $this->created(new CustomerResource($this->customers->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ])), 'Customer created');
    }

    public function update(UpdateCustomerRequest $request, int $customer): JsonResponse
    {
        return $this->success(new CustomerResource($this->customers->update($customer, $request->validated())), 'Customer updated');
    }

    public function destroy(int $customer): JsonResponse
    {
        $this->customers->delete($customer);

        return $this->noContent();
    }
}
