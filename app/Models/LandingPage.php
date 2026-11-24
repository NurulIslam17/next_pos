<?php

namespace App\Models;

use Database\Factories\LandingPageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'brand_name',
    'eyebrow',
    'hero_title',
    'hero_description',
    'primary_cta_label',
    'primary_cta_url',
    'secondary_cta_label',
    'features',
    'showcase_title',
    'showcase_description',
    'contact_email',
    'contact_phone',
    'contact_address',
    'footer_text',
    'is_published',
    'created_by',
])]
class LandingPage extends Model
{
    /** @use HasFactory<LandingPageFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'is_published' => 'boolean',
        ];
    }

    /** @return array<string, mixed> */
    public static function defaultContent(): array
    {
        return [
            'brand_name' => 'ShopFlow',
            'eyebrow' => 'One workspace for every branch',
            'hero_title' => 'Run every shop from one place.',
            'hero_description' => 'Track sales, purchases, products and stock across all your branches from one fast, simple workspace.',
            'primary_cta_label' => 'Sign in to POS',
            'primary_cta_url' => '/login',
            'secondary_cta_label' => 'Explore features',
            'features' => [
                ['title' => 'Fast checkout', 'description' => 'Build baskets and print invoices in seconds.'],
                ['title' => 'Live inventory', 'description' => 'See accurate stock levels for every shop.'],
                ['title' => 'Smart purchasing', 'description' => 'Manage suppliers, costs and approvals in one flow.'],
                ['title' => 'Clear reporting', 'description' => 'Understand sales, stock and branch performance.'],
                ['title' => 'Role based access', 'description' => 'Give every teammate the right level of access.'],
                ['title' => 'Always available', 'description' => 'Open the register from any browser on your network.'],
            ],
            'showcase_title' => 'Built for busy counters',
            'showcase_description' => 'A clean, focused interface keeps your team moving from the first scan to the final receipt.',
            'contact_email' => null,
            'contact_phone' => null,
            'contact_address' => null,
            'footer_text' => 'All rights reserved.',
            'is_published' => true,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
