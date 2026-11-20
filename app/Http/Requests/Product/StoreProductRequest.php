<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Optional: when omitted (or already taken) the service generates the code.
            'sku' => ['nullable', 'string', 'max:100', 'unique:products,sku'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'cost_price' => ['sometimes', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'stock_alert' => ['sometimes', 'integer', 'min:0'],
            'vat' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'vat_type' => ['sometimes', 'string', 'in:included,excluded'],
            'note' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
