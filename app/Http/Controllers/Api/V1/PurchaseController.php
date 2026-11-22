<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Shop;
use App\Services\PurchasePdfService;
use App\Services\PurchaseService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PurchaseController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseService $purchases, protected PurchasePdfService $pdf) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'status' => ['nullable', 'string', 'in:pending,approved'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $purchases = $this->purchases->list(
            (int) ($filters['per_page'] ?? 10),
            isset($filters['search']) ? trim($filters['search']) : null,
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null,
            $filters['status'] ?? null,
        );

        return $this->paginated(PurchaseResource::collection($purchases));
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request);

        return $this->success([
            'purchase_no' => $this->purchases->generatePurchaseNo($this->shopCode($shopId)),
        ]);
    }

    public function show(int $purchase): JsonResponse
    {
        return $this->success(new PurchaseResource($this->purchases->get($purchase)));
    }

    public function downloadPdf(int $purchase): StreamedResponse
    {
        $order = $this->purchases->get($purchase);
        $content = $this->pdf->generate($order);
        $fileName = 'purchase-'.preg_replace('/[^A-Za-z0-9_-]/', '_', (string) $order->purchase_no).'.pdf';

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $fileName, ['Content-Type' => 'application/pdf']);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $shopId = $this->resolveShopId($request);

        return $this->created(new PurchaseResource($this->purchases->create([
            ...$request->validated(),
            'shop_id' => $shopId,
            'shop_code' => $this->shopCode($shopId),
            'created_by' => $request->user()->id,
        ])), 'Purchase order created');
    }

    public function approve(Request $request, int $purchase): JsonResponse
    {
        return $this->success(
            new PurchaseResource($this->purchases->approve($purchase, $request->user()->id)),
            'Purchase approved and stock updated'
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
