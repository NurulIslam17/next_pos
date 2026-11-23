<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LandingPageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'brand_name' => $this->brand_name,
            'eyebrow' => $this->eyebrow,
            'hero_title' => $this->hero_title,
            'hero_description' => $this->hero_description,
            'primary_cta_label' => $this->primary_cta_label,
            'primary_cta_url' => $this->primary_cta_url,
            'secondary_cta_label' => $this->secondary_cta_label,
            'features' => $this->features,
            'showcase_title' => $this->showcase_title,
            'showcase_description' => $this->showcase_description,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'contact_address' => $this->contact_address,
            'footer_text' => $this->footer_text,
            'is_published' => $this->is_published,
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
