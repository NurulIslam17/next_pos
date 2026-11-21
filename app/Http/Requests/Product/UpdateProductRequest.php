<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'sku' => ['sometimes', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($this->route('product'))],
            'category_id' => ['nullable', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'cost_price' => ['sometimes', 'numeric', 'min:0'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'stock_alert' => ['sometimes', 'integer', 'min:0'],
            'vat' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'vat_type' => ['sometimes', 'string', 'in:included,excluded'],
            'note' => ['nullable', 'string'],
            'images' => ['sometimes', 'array', 'max:10'],
            'images.*' => ['file', File::image()->max('5mb')],
            'removed_image_ids' => ['sometimes', 'array', 'max:10'],
            'removed_image_ids.*' => ['integer', Rule::exists('product_images', 'id')->where(fn ($query) => $query->where('product_id', $this->route('product')))],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
