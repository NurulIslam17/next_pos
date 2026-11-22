<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_no' => $this->sale_no,
            'sale_date' => $this->sale_date?->format('Y-m-d'),
            'customer_id' => $this->customer_id,
            'customer_name' => $this->whenLoaded('customer', fn () => $this->customer?->name),
            'shop_id' => $this->shop_id,
            'shop_name' => $this->whenLoaded('shop', fn () => $this->shop?->name),
            'payment_type_id' => $this->payment_type_id,
            'payment_type_name' => $this->whenLoaded('paymentType', fn () => $this->paymentType?->name),
            'reference_no' => $this->reference_no,
            'note' => $this->note,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'vat' => $this->vat,
            'total' => $this->total,
            'paid_amount' => $this->paid_amount,
            'due_amount' => $this->due_amount,
            'status' => $this->status,
            'refund_amount' => $this->refund_amount,
            'return_reason' => $this->return_reason,
            'returned_at' => $this->returned_at?->format('Y-m-d H:i:s'),
            'created_by' => $this->created_by,
            'created_by_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'items' => $this->whenLoaded('items', fn () => SaleItemResource::collection($this->items)),
        ];
    }
}
