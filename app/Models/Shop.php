<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'code', 'address', 'phone', 'is_active'])]
class Shop extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function manager(): HasOne
    {
        return $this->hasOne(User::class)->whereHas('roles', fn ($q) => $q->where('name', 'manager'));
    }
}
