<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $stock = (int) $this->stock;
        $alert = (int) $this->stock_alert;

        $status = 'in';
        if ($stock <= 0) {
            $status = 'out';
        } elseif ($alert > 0 && $stock <= $alert) {
            $status = 'low';
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'category_name' => $this->whenLoaded('category', fn () => $this->category?->name),
            'shop_name' => $this->whenLoaded('createdByShop', fn () => $this->createdByShop?->name),
            'cost_price' => $this->cost_price,
            'price' => $this->price,
            'stock' => $stock,
            'stock_alert' => $alert,
            'stock_value' => (float) ($stock * (float) $this->cost_price),
            'stock_status' => $status,
            'is_active' => $this->is_active,
        ];
    }
}
