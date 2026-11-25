<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\LandingPageController;
use App\Http\Controllers\Api\V1\PaymentTypeController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\ShopController;
use App\Http\Controllers\Api\V1\ShopMonitorController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    Route::get('landing-page', [LandingPageController::class, 'show']);
    Route::get('landing-page/shops', [LandingPageController::class, 'shops']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::match(['put', 'patch'], 'profile', [ProfileController::class, 'update']);
        Route::post('profile/change-password', [ProfileController::class, 'changePassword']);

        Route::get('landing-page/settings', [LandingPageController::class, 'settings'])->middleware('permission:landing_page.view');
        Route::match(['put', 'patch'], 'landing-page', [LandingPageController::class, 'update'])->middleware('permission:landing_page.update');

        // Every route below is guarded by a "{module}.{action}" permission.
        Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard.view');
        Route::get('shop-monitor', [ShopMonitorController::class, 'index'])->middleware('permission:shop_monitor.view');

        Route::controller(ReportController::class)->prefix('reports')->group(function () {
            Route::get('stocks/export', 'exportStocks')->middleware('permission:reports.view');
            Route::get('stocks', 'stocks')->middleware('permission:reports.view');
            Route::get('purchases/export', 'exportPurchases')->middleware('permission:reports.view');
            Route::get('purchases', 'purchases')->middleware('permission:reports.view');
            Route::get('sales/export', 'exportSales')->middleware('permission:reports.view');
            Route::get('sales', 'sales')->middleware('permission:reports.view');
            Route::get('sales-returns/export', 'exportSalesReturns')->middleware('permission:reports.view');
            Route::get('sales-returns', 'salesReturns')->middleware('permission:reports.view');
            Route::get('registrar/export', 'exportRegistrar')->middleware('permission:reports.view');
            Route::get('registrar', 'registrar')->middleware('permission:reports.view');
            Route::get('daily-registrar/pdf', 'exportDailyRegistrarPdf')->middleware('permission:reports.view');
            Route::get('daily-registrar', 'dailyRegistrar')->middleware('permission:reports.view');
        });

        Route::controller(ExpenseController::class)->prefix('expenses')->group(function () {
            Route::get('/', 'index')->middleware('permission:expenses.view');
            Route::post('/', 'store')->middleware('permission:expenses.create');
            Route::match(['put', 'patch'], '{expense}', 'update')->middleware('permission:expenses.update');
            Route::delete('{expense}', 'destroy')->middleware('permission:expenses.delete');
        });

        Route::controller(ProductController::class)->prefix('products')->group(function () {
            Route::get('/', 'index')->middleware('permission:products.view');
            Route::get('all', 'all')->middleware('permission:products.view');
            Route::get('next-sku', 'nextSku')->middleware('permission:products.create');
            Route::get('{product}', 'show')->middleware('permission:products.view');
            Route::post('/', 'store')->middleware('permission:products.create');
            Route::match(['put', 'patch'], '{product}', 'update')->middleware('permission:products.update');
            Route::delete('{product}', 'destroy')->middleware('permission:products.delete');
        });

        Route::controller(PurchaseController::class)->prefix('purchases')->group(function () {
            Route::get('/', 'index')->middleware('permission:purchases.view');
            Route::get('next-number', 'nextNumber')->middleware('permission:purchases.create');
            Route::get('{purchase}/pdf', 'downloadPdf')->middleware('permission:purchases.view');
            Route::post('{purchase}/approve', 'approve')->middleware('permission:purchases.approve');
            Route::get('{purchase}', 'show')->middleware('permission:purchases.view');
            Route::post('/', 'store')->middleware('permission:purchases.create');
        });

        Route::controller(SaleController::class)->prefix('sales')->group(function () {
            Route::get('/', 'index')->middleware('permission:sales.view');
            Route::get('next-number', 'nextNumber')->middleware('permission:sales.create');
            Route::get('{sale}/pdf', 'downloadPdf')->middleware('permission:sales.view');
            Route::post('{sale}/return', 'returnSale')->middleware('permission:sales.return');
            Route::get('{sale}', 'show')->middleware('permission:sales.view');
            Route::post('/', 'store')->middleware('permission:sales.create');
        });

        Route::controller(CategoryController::class)->prefix('categories')->group(function () {
            Route::get('/', 'index')->middleware('permission:categories.view');
            Route::get('all', 'all')->middleware('permission:categories.view');
            Route::post('/', 'store')->middleware('permission:categories.create');
            Route::match(['put', 'patch'], '{category}', 'update')->middleware('permission:categories.update');
            Route::delete('{category}', 'destroy')->middleware('permission:categories.delete');
        });

        Route::controller(BrandController::class)->prefix('brands')->group(function () {
            Route::get('/', 'index')->middleware('permission:brands.view');
            Route::post('/', 'store')->middleware('permission:brands.create');
            Route::match(['put', 'patch'], '{brand}', 'update')->middleware('permission:brands.update');
            Route::delete('{brand}', 'destroy')->middleware('permission:brands.delete');
        });

        Route::controller(ShopController::class)->prefix('shops')->group(function () {
            Route::get('/', 'index')->middleware('permission:shops.view');
            Route::post('/', 'store')->middleware('permission:shops.create');
            Route::match(['put', 'patch'], '{shop}', 'update')->middleware('permission:shops.update');
            Route::delete('{shop}', 'destroy')->middleware('permission:shops.delete');
        });

        Route::controller(SupplierController::class)->prefix('suppliers')->group(function () {
            Route::get('/', 'index')->middleware('permission:suppliers.view');
            Route::post('/', 'store')->middleware('permission:suppliers.create');
            Route::match(['put', 'patch'], '{supplier}', 'update')->middleware('permission:suppliers.update');
            Route::delete('{supplier}', 'destroy')->middleware('permission:suppliers.delete');
        });

        Route::controller(CustomerController::class)->prefix('customers')->group(function () {
            Route::get('/', 'index')->middleware('permission:customers.view');
            Route::get('all', 'all')->middleware('permission:customers.view');
            Route::post('/', 'store')->middleware('permission:customers.create');
            Route::match(['put', 'patch'], '{customer}', 'update')->middleware('permission:customers.update');
            Route::delete('{customer}', 'destroy')->middleware('permission:customers.delete');
        });

        Route::controller(PaymentTypeController::class)->prefix('payment-types')->group(function () {
            Route::get('/', 'index')->middleware('permission:payment_types.view');
            Route::post('/', 'store')->middleware('permission:payment_types.create');
            Route::match(['put', 'patch'], '{payment_type}', 'update')->middleware('permission:payment_types.update');
            Route::delete('{payment_type}', 'destroy')->middleware('permission:payment_types.delete');
        });

        Route::controller(UserController::class)->prefix('users')->group(function () {
            Route::get('/', 'index')->middleware('permission:users.view');
            Route::get('{user}', 'show')->middleware('permission:users.view');
            Route::post('/', 'store')->middleware('permission:users.create');
            Route::match(['put', 'patch'], '{user}', 'update')->middleware('permission:users.update');
            Route::delete('{user}', 'destroy')->middleware('permission:users.delete');
        });

        Route::controller(RoleController::class)->prefix('roles')->group(function () {
            Route::get('/', 'index')->middleware('permission:roles.view');
            Route::post('/', 'store')->middleware('permission:roles.create');
            Route::match(['put', 'patch'], '{role}', 'update')->middleware('permission:roles.update');
            Route::delete('{role}', 'destroy')->middleware('permission:roles.delete');
        });

        Route::controller(PermissionController::class)->prefix('permissions')->group(function () {
            Route::get('/', 'index')->middleware('permission:permissions.view');
            Route::post('/', 'store')->middleware('permission:permissions.create');
            Route::match(['put', 'patch'], '{permission}', 'update')->middleware('permission:permissions.update');
            Route::delete('{permission}', 'destroy')->middleware('permission:permissions.delete');
        });
    });
});
