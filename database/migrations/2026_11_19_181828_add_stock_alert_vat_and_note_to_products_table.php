<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock_alert')->default(0)->after('stock');
            $table->decimal('vat', 5, 2)->default(0)->after('stock_alert');
            $table->text('note')->nullable()->after('vat');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock_alert', 'vat', 'note']);
        });
    }
};
