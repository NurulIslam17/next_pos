<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:100', 'regex:/^[a-z0-9_]+\.[a-z0-9_]+$/',
                Rule::unique('permissions', 'name')->ignore($this->route('permission')),
            ],
        ];
    }

    public function messages(): array
    {
        return ['name.regex' => 'Use the module.action format, e.g. reports.view.'];
    }
}
