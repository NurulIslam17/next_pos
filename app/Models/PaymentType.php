<?php

namespace App\Models;

use Database\Factories\PaymentTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'code', 'description', 'created_by', 'status'])]
class PaymentType extends Model
{
    /** @use HasFactory<PaymentTypeFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    /** @return Attribute<string, string> */
    protected function code(): Attribute
    {
        return Attribute::make(
            set: fn (string $value): string => strtoupper(trim($value)),
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
