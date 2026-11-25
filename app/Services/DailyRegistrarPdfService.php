<?php

namespace App\Services;

use App\Models\Shop;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class DailyRegistrarPdfService
{
    public function generate(array $report, array $filters): string
    {
        $shopLabel = 'All shops';
        if (($filters['shop_id'] ?? null) !== null) {
            $shop = Shop::query()->find($filters['shop_id']);
            $shopLabel = $shop ? "{$shop->name} ({$shop->code})" : 'Selected shop';
        }

        $date = $filters['date'] ?? now()->toDateString();

        $html = view('reports.daily-registrar-pdf', [
            'generatedAt' => now()->format('Y-m-d H:i'),
            'dateLabel' => $date,
            'shopLabel' => $shopLabel,
            'purchases' => $report['purchases'],
            'expenses' => $report['expenses'],
            'sales' => $report['sales'],
            'summary' => $report['summary'],
        ])->render();

        $mpdf = $this->mpdf();
        $mpdf->SetTitle('Daily Registrar Report '.$date);
        $mpdf->SetFooter('Daily Registrar Report '.$date.'||Page {PAGENO} of {nbpg}');
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
            'margin_left' => 24,
            'margin_right' => 24,
            'margin_top' => 24,
            'margin_bottom' => 30,
            'margin_footer' => 10,
        ]);
    }
}
