<?php

namespace App\Providers;

use App\Repositories\Contracts\BrandRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\LandingPageRepositoryInterface;
use App\Repositories\Contracts\PaymentTypeRepositoryInterface;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Repositories\Contracts\ShopRepositoryInterface;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\BrandRepository;
use App\Repositories\Eloquent\CategoryRepository;
use App\Repositories\Eloquent\CustomerRepository;
use App\Repositories\Eloquent\LandingPageRepository;
use App\Repositories\Eloquent\PaymentTypeRepository;
use App\Repositories\Eloquent\PermissionRepository;
use App\Repositories\Eloquent\ProductRepository;
use App\Repositories\Eloquent\PurchaseRepository;
use App\Repositories\Eloquent\RoleRepository;
use App\Repositories\Eloquent\SaleRepository;
use App\Repositories\Eloquent\ShopRepository;
use App\Repositories\Eloquent\SupplierRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        UserRepositoryInterface::class => UserRepository::class,
        BrandRepositoryInterface::class => BrandRepository::class,
        CategoryRepositoryInterface::class => CategoryRepository::class,
        CustomerRepositoryInterface::class => CustomerRepository::class,
        LandingPageRepositoryInterface::class => LandingPageRepository::class,
        ShopRepositoryInterface::class => ShopRepository::class,
        RoleRepositoryInterface::class => RoleRepository::class,
        PermissionRepositoryInterface::class => PermissionRepository::class,
        ProductRepositoryInterface::class => ProductRepository::class,
        SupplierRepositoryInterface::class => SupplierRepository::class,
        PaymentTypeRepositoryInterface::class => PaymentTypeRepository::class,
        PurchaseRepositoryInterface::class => PurchaseRepository::class,
        SaleRepositoryInterface::class => SaleRepository::class,
    ];
}
