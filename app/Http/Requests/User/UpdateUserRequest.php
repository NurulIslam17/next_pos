<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => ['nullable', 'string', 'min:8'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
            'shop_id' => ['nullable', 'exists:shops,id'],
            'phone' => ['nullable', 'string', 'max:20'],
            'nid_number' => ['nullable', 'string', 'max:30', Rule::unique('users', 'nid_number')->ignore($id)],
            'date_of_birth' => ['nullable', 'date'],
            'permanent_address' => ['nullable', 'string', 'max:255'],
            'present_address' => ['nullable', 'string', 'max:255'],
            'salary_account_name' => ['nullable', 'string', 'max:255'],
            'salary_account_number' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'joining_date' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
