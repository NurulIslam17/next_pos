<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'nid_number' => ['nullable', 'string', 'max:30', 'unique:users,nid_number'],
            'date_of_birth' => ['nullable', 'date'],
            'permanent_address' => ['nullable', 'string', 'max:255'],
            'present_address' => ['nullable', 'string', 'max:255'],
            'salary_account_name' => ['nullable', 'string', 'max:255'],
            'salary_account_number' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
