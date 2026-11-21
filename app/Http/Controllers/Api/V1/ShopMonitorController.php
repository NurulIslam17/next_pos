<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShopMonitorController extends Controller
{
    use ApiResponse;

    public function __construct(protected DashboardService $dashboard) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shop_id' => ['required', 'integer', Rule::exists('shops', 'id')],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);

        return $this->success(array_merge([
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'code' => $shop->code,
            ],
            'period' => [
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
        ], $this->dashboard->data(
            (int) $validated['shop_id'],
            $validated['date_from'] ?? null,
            $validated['date_to'] ?? null,
        )));
    }
}
