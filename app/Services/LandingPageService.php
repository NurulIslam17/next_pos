<?php

namespace App\Services;

use App\Models\LandingPage;
use App\Repositories\Contracts\LandingPageRepositoryInterface;

class LandingPageService
{
    public function __construct(protected LandingPageRepositoryInterface $landingPages) {}

    public function current(): ?LandingPage
    {
        return $this->landingPages->current();
    }

    /** @param array<string, mixed> $data */
    public function update(array $data, int $userId): LandingPage
    {
        $landingPage = $this->landingPages->current();

        if ($landingPage) {
            return $this->landingPages->update($landingPage->id, $data);
        }

        return $this->landingPages->create([...$data, 'created_by' => $userId]);
    }
}
