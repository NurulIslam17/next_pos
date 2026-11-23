<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->string('brand_name');
            $table->string('eyebrow')->nullable();
            $table->string('hero_title');
            $table->text('hero_description');
            $table->string('primary_cta_label');
            $table->string('primary_cta_url')->default('/login');
            $table->string('secondary_cta_label')->nullable();
            $table->json('features');
            $table->string('showcase_title');
            $table->text('showcase_description');
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_address')->nullable();
            $table->text('footer_text')->nullable();
            $table->boolean('is_published')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};
