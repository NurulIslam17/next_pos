<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentType\StorePaymentTypeRequest;
use App\Http\Requests\PaymentType\UpdatePaymentTypeRequest;
use App\Http\Resources\PaymentTypeResource;
use App\Services\PaymentTypeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PaymentTypeController extends Controller
{
    use ApiResponse;

    public function __construct(protected PaymentTypeService $paymentTypes) {}

    public function index(): JsonResponse
    {
        return $this->success(PaymentTypeResource::collection($this->paymentTypes->list()));
    }

    public function store(StorePaymentTypeRequest $request): JsonResponse
    {
        return $this->created(new PaymentTypeResource($this->paymentTypes->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ])), 'Payment type created');
    }

    public function update(UpdatePaymentTypeRequest $request, int $payment_type): JsonResponse
    {
        return $this->success(new PaymentTypeResource($this->paymentTypes->update($payment_type, $request->validated())), 'Payment type updated');
    }

    public function destroy(int $payment_type): JsonResponse
    {
        $this->paymentTypes->delete($payment_type);

        return $this->noContent();
    }
}
