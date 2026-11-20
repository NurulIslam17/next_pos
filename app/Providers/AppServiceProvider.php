<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // The super admin role passes every permission check.
        Gate::before(fn ($user) => $user->hasRole('super_admin') ? true : null);
    }
}
