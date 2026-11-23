<?php

namespace App\Repositories\Contracts;

use App\Models\LandingPage;

interface LandingPageRepositoryInterface extends BaseRepositoryInterface
{
    public function current(): ?LandingPage;
}
