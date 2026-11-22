<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseReportResource;
use App\Http\Resources\SalesReportResource;
use App\Http\Resources\SalesReturnReportResource;
use App\Http\Resources\StockReportResource;
use App\Services\ReportExportService;
use App\Services\ReportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(protected ReportService $reports, protected ReportExportService $exporter) {}

    public function stocks(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request, [
            'stock_status' => ['nullable', Rule::in(['all', 'in', 'low', 'out'])],
        ]);

        $report = $this->reports->stocks($filters);

        return $this->paginated(
            StockReportResource::collection($report['paginator']),
            'Success',
            ['summary' => $report['summary']],
        );
    }

    public function purchases(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request, [
            'status' => ['nullable', Rule::in(['all', 'pending', 'approved'])],
        ]);

        $report = $this->reports->purchases($filters);

        return $this->paginated(
            PurchaseReportResource::collection($report['paginator']),
            'Success',
            ['summary' => $report['summary']],
        );
    }

    public function sales(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request, [
            'status' => ['nullable', Rule::in(['all', 'completed', 'returned'])],
        ]);

        $report = $this->reports->sales($filters);

        return $this->paginated(
            SalesReportResource::collection($report['paginator']),
            'Success',
            ['summary' => $report['summary']],
        );
    }

    public function salesReturns(Request $request): JsonResponse
    {
        $report = $this->reports->salesReturns($this->validateFilters($request));

        return $this->paginated(
            SalesReturnReportResource::collection($report['paginator']),
            'Success',
            ['summary' => $report['summary']],
        );
    }

    public function exportStocks(Request $request): StreamedResponse
    {
        return $this->streamCsv('stocks', $this->validateFilters($request, [
            'stock_status' => ['nullable', Rule::in(['all', 'in', 'low', 'out'])],
        ]));
    }

    public function exportPurchases(Request $request): StreamedResponse
    {
        return $this->streamCsv('purchases', $this->validateFilters($request, [
            'status' => ['nullable', Rule::in(['all', 'pending', 'approved'])],
        ]));
    }

    public function exportSales(Request $request): StreamedResponse
    {
        return $this->streamCsv('sales', $this->validateFilters($request, [
            'status' => ['nullable', Rule::in(['all', 'completed', 'returned'])],
        ]));
    }

    public function exportSalesReturns(Request $request): StreamedResponse
    {
        return $this->streamCsv('sales-returns', $this->validateFilters($request));
    }

    private function streamCsv(string $report, array $filters): StreamedResponse
    {
        $content = $this->exporter->csv($report, $filters);

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $this->exportFilename($report, $filters), [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    private function exportFilename(string $report, array $filters): string
    {
        $parts = [$report, 'report', 'exported-'.now()->toDateString()];

        if (isset($filters['date_from'])) {
            $parts[] = 'from-'.$filters['date_from'];
        }

        if (isset($filters['date_to'])) {
            $parts[] = 'to-'.$filters['date_to'];
        }

        return implode('-', $parts).'.csv';
    }

    private function validateFilters(Request $request, array $rules = []): array
    {
        $filters = $request->validate(array_merge([
            'shop_id' => ['nullable', 'integer', Rule::exists('shops', 'id')],
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ], $rules));

        $user = $request->user();
        if ($user?->hasRole('manager')) {
            $filters['shop_id'] = $user->shop_id;
        }

        return $filters;
    }
}
