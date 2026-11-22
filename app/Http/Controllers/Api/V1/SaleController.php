<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\ReturnSaleRequest;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Shop;
use App\Services\SalePdfService;
use App\Services\SaleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SaleController extends Controller
{
    use ApiResponse;

    public function __construct(protected SaleService $sales, protected SalePdfService $pdf) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $sales = $this->sales->list(
            (int) ($filters['per_page'] ?? 10),
            isset($filters['search']) ? trim($filters['search']) : null,
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null,
        );

        return $this->paginated(SaleResource::collection($sales));
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request);

        return $this->success([
            'sale_no' => $this->sales->generateSaleNo($this->shopCode($shopId)),
        ]);
    }

    public function show(int $sale): JsonResponse
    {
        return $this->success(new SaleResource($this->sales->get($sale)));
    }

    public function downloadPdf(int $sale): StreamedResponse
    {
        $order = $this->sales->get($sale);
        $content = $this->pdf->generate($order);
        $fileName = 'sale-'.preg_replace('/[^A-Za-z0-9_-]/', '_', (string) $order->sale_no).'.pdf';

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $fileName, ['Content-Type' => 'application/pdf']);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request);

        return $this->created(new SaleResource($this->sales->create([
            ...$request->validated(),
            'shop_id' => $shopId,
            'shop_code' => $this->shopCode($shopId),
            'created_by' => $request->user()->id,
        ])), 'Sale created');
    }

    public function returnSale(ReturnSaleRequest $request, int $sale): JsonResponse
    {
        return $this->success(
            new SaleResource($this->sales->return($sale, $request->validated())),
            'Sale returned and stock restored'
        );
    }

    private function resolveShopId(Request $request): ?int
    {
        if ($request->user()->hasRole('manager')) {
            return $request->user()->shop_id;
        }

        return $request->integer('shop_id') ?: null;
    }

    private function shopCode(?int $shopId): ?string
    {
        return $shopId ? Shop::whereKey($shopId)->value('code') : null;
    }
}
