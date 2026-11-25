<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::findOrCreate('suppliers.create', 'web');
        Role::findOrCreate('manager', 'web')->givePermissionTo($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::findByName('suppliers.create', 'web');
        Role::findByName('manager', 'web')->revokePermissionTo($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
