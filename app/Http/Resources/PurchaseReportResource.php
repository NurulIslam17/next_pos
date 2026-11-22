<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_no' => $this->purchase_no,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'supplier_name' => $this->whenLoaded('supplier', fn () => $this->supplier?->name),
            'shop_name' => $this->whenLoaded('shop', fn () => $this->shop?->name),
            'payment_type_name' => $this->whenLoaded('paymentType', fn () => $this->paymentType?->name),
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'vat' => $this->vat,
            'total' => $this->total,
            'paid_amount' => $this->paid_amount,
            'due_amount' => $this->due_amount,
            'item_count' => (int) $this->items_count,
            'status' => $this->status,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
        ];
    }
}
