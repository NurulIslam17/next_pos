<?php

namespace App\Http\Requests\Purchase;

use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'purchase_no' => ['nullable', 'string', 'max:100', 'unique:purchases,purchase_no'],
            'purchase_date' => ['required', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'shop_id' => ['nullable', 'exists:shops,id'],
            'payment_type_id' => ['nullable', 'exists:payment_types,id'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string'],
            'paid_amount' => ['sometimes', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.vat_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'items.*.discount' => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $productIds = collect($this->input('items', []))
                ->pluck('product_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            if ($productIds === []) {
                return;
            }

            $shopId = $this->integer('shop_id') ?: null;

            $availableIds = Product::query()
                ->whereIn('id', $productIds)
                ->when($shopId, fn ($query) => $query->where('created_by_shop_id', $shopId))
                ->pluck('id')
                ->all();

            if (count($availableIds) !== count($productIds)) {
                $validator->errors()->add('items', 'One or more products are not available for the selected shop.');
            }
        });
    }
}
