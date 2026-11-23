<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LandingPage\UpdateLandingPageRequest;
use App\Http\Resources\LandingPageResource;
use App\Http\Resources\PublicShopResource;
use App\Services\LandingPageService;
use App\Services\ShopService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class LandingPageController extends Controller
{
    use ApiResponse;

    public function __construct(protected LandingPageService $landingPages, protected ShopService $shops) {}

    public function show(): JsonResponse
    {
        $landingPage = $this->landingPages->current();

        if (! $landingPage?->is_published) {
            return $this->error('Landing page is not published.', 404);
        }

        return $this->success(new LandingPageResource($landingPage));
    }

    public function shops(): JsonResponse
    {
        return $this->success(PublicShopResource::collection($this->shops->names()));
    }

    public function settings(): JsonResponse
    {
        $landingPage = $this->landingPages->current();

        if (! $landingPage) {
            return $this->error('Landing page has not been created.', 404);
        }

        return $this->success(new LandingPageResource($landingPage));
    }

    public function update(UpdateLandingPageRequest $request): JsonResponse
    {
        $landingPage = $this->landingPages->update($request->validated(), $request->user()->id);

        return $this->success(new LandingPageResource($landingPage), 'Landing page updated');
    }
}
