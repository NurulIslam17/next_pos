<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'roles' => $this->roles->pluck('name'),
            'role' => $this->roles->first()?->name,
            'permissions' => $this->when($this->includePermissions, fn () => $this->permissionNames()),
            'shop_id' => $this->shop_id,
            'shop' => $this->whenLoaded('shop', fn () => $this->shop?->name),
            'nid_number' => $this->nid_number,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'permanent_address' => $this->permanent_address,
            'present_address' => $this->present_address,
            'salary_account_name' => $this->salary_account_name,
            'salary_account_number' => $this->salary_account_number,
            'bank_name' => $this->bank_name,
            'salary' => $this->salary,
            'joining_date' => $this->joining_date?->toDateString(),
            'is_active' => $this->is_active,
            'photo_url' => $this->photo_path ? Storage::url($this->photo_path) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /** Set on the "current user" payloads so the frontend knows what to show. */
    public bool $includePermissions = false;

    public function withPermissions(): static
    {
        $this->includePermissions = true;

        return $this;
    }

    private function permissionNames()
    {
        return $this->hasRole('super_admin')
            ? Permission::pluck('name')
            : $this->getAllPermissions()->pluck('name')->values();
    }
}
