<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_no' => $this->sale_no,
            'sale_date' => $this->sale_date?->format('Y-m-d'),
            'customer_name' => $this->whenLoaded('customer', fn () => $this->customer?->name),
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
            'refund_amount' => $this->refund_amount,
            'returned_at' => $this->returned_at?->format('Y-m-d H:i:s'),
        ];
    }
}
