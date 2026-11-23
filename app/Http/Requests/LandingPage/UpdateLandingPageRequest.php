<?php

namespace App\Http\Requests\LandingPage;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'brand_name' => ['required', 'string', 'max:100'],
            'eyebrow' => ['nullable', 'string', 'max:150'],
            'hero_title' => ['required', 'string', 'max:200'],
            'hero_description' => ['required', 'string', 'max:1000'],
            'primary_cta_label' => ['required', 'string', 'max:80'],
            'primary_cta_url' => ['required', 'string', 'max:255', 'regex:/^(https?:\/\/|\/)[^\s]*$/i'],
            'secondary_cta_label' => ['nullable', 'string', 'max:80'],
            'features' => ['required', 'array', 'min:1', 'max:6'],
            'features.*' => ['array:title,description'],
            'features.*.title' => ['required', 'string', 'max:100'],
            'features.*.description' => ['required', 'string', 'max:255'],
            'showcase_title' => ['required', 'string', 'max:200'],
            'showcase_description' => ['required', 'string', 'max:1000'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_address' => ['nullable', 'string', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
