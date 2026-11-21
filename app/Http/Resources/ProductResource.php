<?php

namespace App\Http\Resources;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'created_by_shop_id' => $this->created_by_shop_id,
            'created_by_shop' => $this->whenLoaded('createdByShop', fn () => $this->createdByShop?->name),
            'category_id' => $this->category_id,
            'category' => $this->category?->name,
            'brand_id' => $this->brand_id,
            'brand' => $this->brand?->name,
            'supplier_id' => $this->supplier_id,
            'supplier' => $this->supplier?->name,
            'cost_price' => $this->cost_price,
            'price' => $this->price,
            'stock' => $this->stock,
            'stock_alert' => $this->stock_alert,
            'vat' => $this->vat,
            'vat_type' => $this->vat_type,
            'note' => $this->note,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn (ProductImage $image): array => [
                'id' => $image->id,
                'url' => Storage::url($image->path),
                'original_name' => $image->original_name,
                'sort_order' => $image->sort_order,
            ])->values()->all()),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
