<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_no' => $this->sale_no,
            'sale_date' => $this->sale_date?->format('Y-m-d'),
            'returned_at' => $this->returned_at?->format('Y-m-d H:i:s'),
            'customer_name' => $this->whenLoaded('customer', fn () => $this->customer?->name),
            'shop_name' => $this->whenLoaded('shop', fn () => $this->shop?->name),
            'payment_type_name' => $this->whenLoaded('paymentType', fn () => $this->paymentType?->name),
            'item_count' => (int) $this->items_count,
            'total' => $this->total,
            'refund_amount' => $this->refund_amount,
            'return_reason' => $this->return_reason,
        ];
    }
}
