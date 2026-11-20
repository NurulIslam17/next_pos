<?php

use Illuminate\Support\Facades\Route;

// Single-page React app: every non-API route is handled by the client-side router.
Route::view('/{any?}', 'app')->where('any', '^(?!api|up).*$');
