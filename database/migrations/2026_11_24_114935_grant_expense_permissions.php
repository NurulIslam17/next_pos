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

        $actions = ['view', 'create', 'update', 'delete'];
        $permissions = collect($actions)->map(fn (string $action) => Permission::findOrCreate("expenses.{$action}", 'web'));

        Role::findOrCreate('super_admin', 'web')->givePermissionTo($permissions);
        Role::findOrCreate('manager', 'web')->givePermissionTo($permissions);
        Role::findOrCreate('viewer', 'web')->givePermissionTo(Permission::findOrCreate('expenses.view', 'web'));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = Permission::query()->whereIn('name', [
            'expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete',
        ])->get();

        foreach (['super_admin', 'manager', 'viewer'] as $roleName) {
            Role::findByName($roleName, 'web')->revokePermissionTo($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
