<?php

namespace App\Http\Requests\Brand;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('brands', 'name')->ignore($this->route('brand'))],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'boolean'],
        ];
    }
}
