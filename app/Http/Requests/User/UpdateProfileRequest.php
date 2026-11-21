<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($this->user())],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'nid_number' => ['sometimes', 'nullable', 'string', 'max:30', Rule::unique('users', 'nid_number')->ignore($this->user())],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'joining_date' => ['sometimes', 'nullable', 'date'],
            'bank_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'salary_account_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'salary_account_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'permanent_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'present_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'photo' => ['sometimes', 'nullable', 'file', File::types(['jpg', 'jpeg', 'png', 'webp'])->max('2mb')],
            'remove_photo' => ['sometimes', 'boolean'],
        ];
    }
}
