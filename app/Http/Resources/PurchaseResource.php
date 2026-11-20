<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_no' => $this->purchase_no,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->whenLoaded('supplier', fn () => $this->supplier?->name),
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
            'created_by_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'approved_by' => $this->approved_by,
            'approved_by_name' => $this->whenLoaded('approver', fn () => $this->approver?->name),
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'items' => $this->whenLoaded('items', fn () => PurchaseItemResource::collection($this->items)),
        ];
    }
}
