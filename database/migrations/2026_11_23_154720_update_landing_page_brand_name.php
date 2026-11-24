<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('landing_pages')
            ->where('brand_name', 'My POS')
            ->update(['brand_name' => 'ShopFlow']);
    }

    public function down(): void
    {
        DB::table('landing_pages')
            ->where('brand_name', 'ShopFlow')
            ->update(['brand_name' => 'My POS']);
    }
};
