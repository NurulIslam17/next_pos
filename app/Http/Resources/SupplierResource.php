<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'nid_number' => $this->nid_number,
            'tin_number' => $this->tin_number,
            'trade_license_number' => $this->trade_license_number,
            'occupation' => $this->occupation,
            'is_active' => $this->is_active,
        ];
    }
}
