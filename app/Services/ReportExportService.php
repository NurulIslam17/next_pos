<?php

namespace App\Services;

use App\Http\Resources\PurchaseReportResource;
use App\Http\Resources\SalesReportResource;
use App\Http\Resources\SalesReturnReportResource;
use App\Http\Resources\StockReportResource;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class ReportExportService
{
    private const COLUMNS = [
        'stocks' => [
            'SKU' => 'sku',
            'Product' => 'name',
            'Category' => 'category_name',
            'Shop' => 'shop_name',
            'Cost Price' => 'cost_price',
            'Price' => 'price',
            'Stock' => 'stock',
            'Alert Level' => 'stock_alert',
            'Stock Value' => 'stock_value',
            'Status' => 'stock_status',
        ],
        'purchases' => [
            'Purchase No' => 'purchase_no',
            'Date' => 'purchase_date',
            'Supplier' => 'supplier_name',
            'Shop' => 'shop_name',
            'Payment Type' => 'payment_type_name',
            'Subtotal' => 'subtotal',
            'Discount' => 'discount',
            'VAT' => 'vat',
            'Total' => 'total',
            'Paid' => 'paid_amount',
            'Due' => 'due_amount',
            'Items' => 'item_count',
        ],
        'sales' => [
            'Sale No' => 'sale_no',
            'Date' => 'sale_date',
            'Customer' => 'customer_name',
            'Shop' => 'shop_name',
            'Payment Type' => 'payment_type_name',
            'Subtotal' => 'subtotal',
            'Discount' => 'discount',
            'VAT' => 'vat',
            'Total' => 'total',
            'Paid' => 'paid_amount',
            'Due' => 'due_amount',
            'Items' => 'item_count',
            'Status' => 'status',
            'Refund' => 'refund_amount',
            'Returned At' => 'returned_at',
        ],
        'sales-returns' => [
            'Sale No' => 'sale_no',
            'Sale Date' => 'sale_date',
            'Returned At' => 'returned_at',
            'Customer' => 'customer_name',
            'Shop' => 'shop_name',
            'Payment Type' => 'payment_type_name',
            'Items' => 'item_count',
            'Total' => 'total',
            'Refund' => 'refund_amount',
            'Reason' => 'return_reason',
        ],
    ];

    private const PURCHASE_TOTAL_FIELDS = [
        'subtotal' => 'subtotal',
        'vat' => 'vat',
        'total' => 'total',
        'paid_amount' => 'paid_amount',
        'item_count' => 'items_count',
    ];

    private const RESOURCES = [
        'stocks' => StockReportResource::class,
        'purchases' => PurchaseReportResource::class,
        'sales' => SalesReportResource::class,
        'sales-returns' => SalesReturnReportResource::class,
    ];

    public function __construct(protected ReportService $reports) {}

    public function csv(string $report, array $filters): string
    {
        if (! isset(self::COLUMNS[$report], self::RESOURCES[$report])) {
            throw new InvalidArgumentException("Unknown report: {$report}");
        }

        $rows = $this->reports->rows($report, $filters);

        if ($report === 'sales') {
            return $this->salesCsv($rows, $filters);
        }

        $columns = self::COLUMNS[$report];

        $handle = fopen('php://temp', 'w+');
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, array_keys($columns));

        foreach ($rows as $row) {
            $data = $this->resourceData($report, $row);
            fputcsv($handle, array_map(
                fn (string $key): string => $this->csvValue($data[$key] ?? null),
                array_values($columns)
            ));
        }

        if ($report === 'purchases') {
            fputcsv($handle, $this->purchaseTotalRow($rows, $columns));
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return $content === false ? '' : $content;
    }

    private function purchaseTotalRow(Collection $purchases, array $columns): array
    {
        $row = array_fill(0, count($columns), '');
        $row[0] = 'Total';

        foreach (array_values($columns) as $index => $key) {
            if (! array_key_exists($key, self::PURCHASE_TOTAL_FIELDS)) {
                continue;
            }

            $sum = (float) $purchases->sum(self::PURCHASE_TOTAL_FIELDS[$key]);
            $row[$index] = $key === 'item_count'
                ? (string) (int) $sum
                : number_format($sum, 2, '.', '');
        }

        return $row;
    }

    private function salesCsv(Collection $sales, array $filters): string
    {
        $handle = fopen('php://temp', 'w+');
        fwrite($handle, "\xEF\xBB\xBF");

        fputcsv($handle, ['Detailed Sale Report']);
        fputcsv($handle, ['Date: '.$this->salesDateRange($sales, $filters)]);
        fputcsv($handle, ['User: All']);
        fputcsv($handle, []);
        fputcsv($handle, ['Sale Report:']);
        fputcsv($handle, ['SN', 'Date', 'Invoice No', 'Customer', 'Item Details', '', '', '', '', '', '', 'Subtotal', 'Discount', 'VAT', 'G.Total']);
        fputcsv($handle, ['', '', '', '', 'Code', 'Name', 'Purchase Price', 'Selling Price', 'Discount', 'Qty', 'VAT', '', '', '', '']);
        fputcsv($handle, ['', '', '', '', '', '(Serial)', '', '', '', '', '', '', '', '', '']);

        $firstDataRow = 9;
        $lastDataRow = $firstDataRow - 1;
        $serial = 1;

        foreach ($sales as $sale) {
            $items = $sale->relationLoaded('items') ? $sale->items : collect();

            if ($items->isEmpty()) {
                fputcsv($handle, [
                    $serial,
                    $this->saleDate($sale),
                    $sale->sale_no,
                    $sale->customer?->name ?? '',
                    '', '', '', '', '', '', '',
                    $this->number($sale->subtotal),
                    $this->number($sale->discount),
                    $this->number($sale->vat),
                    $this->number($sale->total),
                ]);
                $lastDataRow++;
                $serial++;

                continue;
            }

            foreach ($items as $item) {
                $isFirstItem = $item === $items->first();

                fputcsv($handle, [
                    $isFirstItem ? $serial : '',
                    $isFirstItem ? $this->saleDate($sale) : '',
                    $isFirstItem ? $sale->sale_no : '',
                    $isFirstItem ? ($sale->customer?->name ?? '') : '',
                    $item->product_sku,
                    $item->product_name,
                    $this->number($item->product?->cost_price ?? 0),
                    $this->number($item->unit_price),
                    $this->number($item->discount),
                    $item->quantity,
                    $this->itemVat($item),
                    $isFirstItem ? $this->number($sale->subtotal) : '',
                    $isFirstItem ? $this->number($sale->discount) : '',
                    $isFirstItem ? $this->number($sale->vat) : '',
                    $isFirstItem ? $this->number($sale->total) : '',
                ]);
                $lastDataRow++;
            }

            $serial++;
        }

        fputcsv($handle, $this->salesTotalRow($firstDataRow, $lastDataRow));

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return $content === false ? '' : $content;
    }

    private function salesTotalRow(int $firstDataRow, int $lastDataRow): array
    {
        $row = array_fill(0, 15, '');
        $row[5] = 'Total';
        $lastDataRow = max($firstDataRow, $lastDataRow);

        foreach (['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as $index => $column) {
            $row[$index + 6] = '=SUM('.$column.$firstDataRow.':'.$column.$lastDataRow.')';
        }

        return $row;
    }

    private function salesDateRange(Collection $sales, array $filters): string
    {
        $earliestTimestamp = $sales->min(fn (Sale $sale): ?int => $sale->sale_date?->timestamp);
        $latestTimestamp = $sales->max(fn (Sale $sale): ?int => $sale->sale_date?->timestamp);

        $from = isset($filters['date_from'])
            ? Carbon::parse($filters['date_from'])->startOfDay()
            : ($earliestTimestamp ? Carbon::createFromTimestamp($earliestTimestamp)->startOfDay() : now()->startOfYear());

        $to = isset($filters['date_to'])
            ? Carbon::parse($filters['date_to'])->endOfDay()
            : ($latestTimestamp ? Carbon::createFromTimestamp($latestTimestamp)->endOfDay() : now()->endOfDay());

        return $from->format('Y/m/d h:i A').' - '.$to->format('d/m/Y h:i A');
    }

    private function saleDate(Sale $sale): string
    {
        $timestamp = $sale->created_at ?? $sale->sale_date;

        return $timestamp?->format('d/m/Y h:i:A') ?? '';
    }

    private function itemVat(SaleItem $item): string
    {
        return $this->number((float) $item->line_total * (float) $item->vat_rate / 100);
    }

    private function number(mixed $value): string
    {
        $formatted = number_format((float) $value, 2, '.', '');

        return rtrim(rtrim($formatted, '0'), '.');
    }

    private function resourceData(string $report, mixed $row): array
    {
        $resourceClass = self::RESOURCES[$report];

        return (new $resourceClass($row))->resolve(request());
    }

    private function csvValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        $value = (string) $value;

        if (! is_numeric($value) && preg_match('/^[=+\-@\t\r]/', $value)) {
            return "'".$value;
        }

        return $value;
    }
}
