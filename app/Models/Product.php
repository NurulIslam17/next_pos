<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['category_id', 'brand_id', 'supplier_id', 'created_by_shop_id', 'name', 'sku', 'cost_price', 'price', 'stock', 'stock_alert', 'vat', 'vat_type', 'note', 'is_active'])]
class Product extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new ManagerShopScope);
    }

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'price' => 'decimal:2',
            'stock' => 'integer',
            'stock_alert' => 'integer',
            'vat' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function createdByShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'created_by_shop_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order')->orderBy('id');
    }
}
