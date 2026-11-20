<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /** @var array<string, list<string>> module => actions */
    public const MODULES = [
        'dashboard' => ['view'],
        'products' => ['view', 'create', 'update', 'delete'],
        'purchases' => ['view', 'create', 'approve'],
        'categories' => ['view', 'create', 'update', 'delete'],
        'brands' => ['view', 'create', 'update', 'delete'],
        'barcodes' => ['view'],
        'shops' => ['view', 'create', 'update', 'delete'],
        'suppliers' => ['view', 'create', 'update', 'delete'],
        'payment_types' => ['view', 'create', 'update', 'delete'],
        'users' => ['view', 'create', 'update', 'delete'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'permissions' => ['view', 'create', 'update', 'delete'],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::MODULES as $module => $actions) {
            foreach ($actions as $action) {
                Permission::findOrCreate("{$module}.{$action}", 'web');
            }
        }

        // Model events are disabled while seeding, so refresh Spatie's cache by hand.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $all = Permission::pluck('name');

        // Super admin: everything (also bypassed by Gate::before).
        Role::findOrCreate('super_admin', 'web')->syncPermissions($all);

        // Shop manager: manage products, read the rest of the catalogue.
        Role::findOrCreate('manager', 'web')->syncPermissions([
            'dashboard.view',
            'products.view', 'products.create', 'products.update', 'products.delete',
            'purchases.view', 'purchases.create',
            'categories.view', 'brands.view', 'barcodes.view', 'shops.view', 'suppliers.view',
            'payment_types.view',
        ]);

        // Viewer: read-only across the whole system.
        Role::findOrCreate('viewer', 'web')->syncPermissions($all->filter(fn ($name) => str_ends_with($name, '.view'))->values());

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
