<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'manager' => $this->whenLoaded('manager', fn () => $this->manager?->name),
            'users_count' => $this->whenCounted('users'),
        ];
    }
}
