<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use DateTimeInterface;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class PurchasePdfService
{
    public function generate(Purchase $purchase): string
    {
        if ($purchase->exists) {
            $purchase->loadMissing(['supplier', 'shop', 'paymentType', 'creator', 'approver', 'items.product']);
        }

        $html = view('purchase-pdf', [
            'purchaseNo' => (string) $purchase->purchase_no,
            'purchaseDate' => $this->formatDate($purchase->purchase_date),
            'supplier' => (string) ($purchase->supplier?->name ?: '-'),
            'shop' => (string) ($purchase->shop?->name ?: '-'),
            'paymentType' => (string) ($purchase->paymentType?->name ?: '-'),
            'referenceNo' => (string) ($purchase->reference_no ?: '-'),
            'createdBy' => (string) ($purchase->creator?->name ?: '-'),
            'approvedBy' => (string) ($purchase->approver?->name ?: '-'),
            'approvedAt' => $this->formatDate($purchase->approved_at, 'Y-m-d H:i'),
            'status' => strtoupper((string) $purchase->status),
            'items' => $purchase->items->values()->map(fn (PurchaseItem $item, int $index): array => [
                'number' => $index + 1,
                'product' => (string) ($item->product_name ?: '-'),
                'sku' => (string) ($item->product_sku ?: '-'),
                'quantity' => (string) $item->quantity,
                'unitCost' => $this->money($item->unit_cost),
                'vatRate' => $this->money($item->vat_rate).'%',
                'discount' => $this->money($item->discount),
                'lineTotal' => $this->money($item->line_total),
            ])->all(),
            'subtotal' => $this->money($purchase->subtotal),
            'discount' => '-'.$this->money($purchase->discount),
            'vat' => $this->money($purchase->vat),
            'total' => $this->money($purchase->total),
            'paid' => $this->money($purchase->paid_amount),
            'due' => $this->money($purchase->due_amount),
            'note' => $purchase->note ? (string) $purchase->note : null,
        ])->render();

        $mpdf = $this->mpdf();
        $mpdf->SetTitle('Purchase '.$purchase->purchase_no);
        $mpdf->SetFooter('Purchase '.$purchase->purchase_no.'||Page {PAGENO} of {nbpg}');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    private function mpdf(): Mpdf
    {
        $configDefaults = (new ConfigVariables)->getDefaults();
        $fontDefaults = (new FontVariables)->getDefaults();

        return new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font' => 'kalpurush',
            'fontDir' => array_merge([resource_path('fonts')], $configDefaults['fontDir']),
            'tempDir' => storage_path('framework/mpdf'),
            'fontdata' => array_merge($fontDefaults['fontdata'], [
                'kalpurush' => [
                    'R' => 'kalpurush.ttf',
                    'B' => 'kalpurush.ttf',
                    'I' => 'kalpurush.ttf',
                    'BI' => 'kalpurush.ttf',
                    'useOTL' => 0xFF,
                    'useKashida' => 75,
                ],
            ]),
            'margin_left' => 36,
            'margin_right' => 36,
            'margin_top' => 36,
            'margin_bottom' => 40,
            'margin_footer' => 10,
        ]);
    }

    private function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', ',');
    }

    private function formatDate(mixed $value, string $format = 'Y-m-d'): string
    {
        return $value instanceof DateTimeInterface ? $value->format($format) : '-';
    }
}
