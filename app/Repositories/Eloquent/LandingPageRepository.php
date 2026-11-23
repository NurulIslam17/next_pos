<?php

namespace App\Repositories\Eloquent;

use App\Models\LandingPage;
use App\Repositories\Contracts\LandingPageRepositoryInterface;

class LandingPageRepository extends BaseRepository implements LandingPageRepositoryInterface
{
    public function __construct(LandingPage $model)
    {
        parent::__construct($model);
    }

    public function current(): ?LandingPage
    {
        return $this->model->with('creator')->orderBy('id')->first();
    }
}
