<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $quantity = (float) $this->quantity;
        $unitPrice = (float) $this->unit_price;
        $discount = (float) $this->discount;
        $vatRate = (float) $this->vat_rate;
        $net = max(($quantity * $unitPrice) - $discount, 0);
        $vat = round($net - ($net / (1 + ($vatRate / 100))), 2);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_sku' => $this->product_sku,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'vat_rate' => $this->vat_rate,
            'vat_type' => $this->product?->vat_type ?? 'included',
            'discount' => $this->discount,
            'vat' => $vat,
            'line_total' => $this->line_total,
        ];
    }
}
