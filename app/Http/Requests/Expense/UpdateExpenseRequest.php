<?php

namespace App\Http\Requests\Expense;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'expense_date' => ['sometimes', 'date_format:Y-m-d'],
            'shop_id' => [Rule::requiredIf(! $this->user()?->hasRole('manager')), 'nullable', 'integer', Rule::exists('shops', 'id')],
            'category' => ['sometimes', 'string', 'max:100'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
