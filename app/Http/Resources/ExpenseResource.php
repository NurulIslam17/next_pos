<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_date' => $this->expense_date?->toDateString(),
            'shop_id' => $this->shop_id,
            'shop_name' => $this->shop?->name,
            'shop_code' => $this->shop?->code,
            'category' => $this->category,
            'reference_no' => $this->reference_no,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'note' => $this->note,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
