<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use DateTimeInterface;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class SalePdfService
{
    public function generate(Sale $sale): string
    {
        if ($sale->exists) {
            $sale->loadMissing(['customer', 'shop', 'paymentType', 'creator', 'items.product']);
        }

        $html = view('sale-invoice', [
            'saleNo' => (string) $sale->sale_no,
            'saleDate' => $this->formatDate($sale->sale_date),
            'customer' => (string) ($sale->customer?->name ?: 'Walk-in Customer'),
            'shop' => (string) ($sale->shop?->name ?: '-'),
            'paymentType' => (string) ($sale->paymentType?->name ?: '-'),
            'referenceNo' => (string) ($sale->reference_no ?: '-'),
            'createdBy' => (string) ($sale->creator?->name ?: '-'),
            'status' => strtoupper((string) $sale->status),
            'returnedAt' => $this->formatDate($sale->returned_at, 'Y-m-d H:i'),
            'refund' => $this->money($sale->refund_amount),
            'items' => $sale->items->values()->map(fn (SaleItem $item, int $index): array => [
                'number' => $index + 1,
                'product' => (string) ($item->product_name ?: '-'),
                'sku' => (string) ($item->product_sku ?: '-'),
                'quantity' => (string) $item->quantity,
                'unitPrice' => $this->money($item->unit_price),
                'vatRate' => $this->money($item->vat_rate).'%',
                'discount' => $this->money($item->discount),
                'lineTotal' => $this->money($item->line_total),
            ])->all(),
            'subtotal' => $this->money($sale->subtotal),
            'discount' => '-'.$this->money($sale->discount),
            'vat' => $this->money($sale->vat),
            'total' => $this->money($sale->total),
            'paid' => $this->money($sale->paid_amount),
            'due' => $this->money($sale->due_amount),
            'note' => $sale->note ? (string) $sale->note : null,
        ])->render();

        $mpdf = $this->mpdf();
        $mpdf->SetTitle('Sale '.$sale->sale_no);
        $mpdf->SetFooter('Sale '.$sale->sale_no.'||Page {PAGENO} of {nbpg}');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    private function mpdf(): Mpdf
    {
        $configDefaults = (new ConfigVariables)->getDefaults();
        $fontDefaults = (new FontVariables)->getDefaults();

        return new Mpdf([
            'mode' => 'utf-8',
            'format' => [80, 297],
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
            'margin_left' => 3,
            'margin_right' => 3,
            'margin_top' => 3,
            'margin_bottom' => 6,
            'margin_footer' => 3,
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
