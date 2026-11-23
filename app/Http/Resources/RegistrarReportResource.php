<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrarReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $decimal = fn (mixed $value): string => number_format((float) $value, 2, '.', '');

        return [
            'id' => $this['id'],
            'date' => $this['date'],
            'type' => $this['type'],
            'reference_no' => $this['reference_no'],
            'party_name' => $this['party_name'],
            'shop_name' => $this['shop_name'],
            'item_count' => (int) $this['item_count'],
            'subtotal' => $decimal($this['subtotal']),
            'discount' => $decimal($this['discount']),
            'vat' => $decimal($this['vat']),
            'total' => $decimal($this['total']),
            'paid_amount' => $decimal($this['paid_amount']),
            'due_amount' => $decimal($this['due_amount']),
            'status' => $this['status'],
            'net_amount' => $decimal($this['net_amount']),
        ];
    }
}
