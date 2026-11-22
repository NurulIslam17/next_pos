<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\PaymentType;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/sales')->assertUnauthorized();
    }

    public function test_forbids_user_without_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/sales')
            ->assertForbidden();
    }

    public function test_lists_and_searches_sales(): void
    {
        $shop = $this->shop('DHA');
        $user = $this->userWithRole('manager', $shop->id, ['sales.view']);
        $customer = Customer::create(['name' => 'Searchable Customer', 'created_by' => $user->id]);
        Sale::factory()->create([
            'sale_no' => 'SAL-OLD-001',
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDay(),
        ]);
        Sale::factory()->create([
            'sale_no' => 'SAL-NEW-001',
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'created_at' => now(),
        ]);

        $this->actingAs($user)->getJson('/api/v1/sales?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sale_no', 'SAL-NEW-001')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 1);

        $this->actingAs($user)->getJson('/api/v1/sales?search=Searchable')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($user)->getJson('/api/v1/sales?search=SAL-NEW')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sale_no', 'SAL-NEW-001');
    }

    public function test_creates_sale_with_totals_and_decrements_stock(): void
    {
        $shop = $this->shop('DHA');
        $product = $this->product($shop, 'PTK-001', 5);
        $customer = Customer::create(['name' => 'Walk-in Customer']);
        $paymentType = PaymentType::create(['name' => 'Cash', 'code' => 'CASH', 'created_by' => null]);
        $user = $this->userWithRole('manager', $shop->id, ['sales.view', 'sales.create']);

        $this->actingAs($user)->postJson('/api/v1/sales', [
            'sale_no' => 'SAL-CUSTOM-001',
            'sale_date' => '2026-11-21',
            'customer_id' => $customer->id,
            'payment_type_id' => $paymentType->id,
            'paid_amount' => 100,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit_price' => 100,
                    'vat_rate' => 5,
                    'discount' => 10,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.sale_no', 'SAL-CUSTOM-001')
            ->assertJsonPath('data.customer_name', 'Walk-in Customer')
            ->assertJsonPath('data.subtotal', '200.00')
            ->assertJsonPath('data.discount', '10.00')
            ->assertJsonPath('data.vat', '9.05')
            ->assertJsonPath('data.total', '190.00')
            ->assertJsonPath('data.due_amount', '90.00')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.created_by', $user->id)
            ->assertJsonPath('data.items.0.line_total', '190.00');

        $this->assertSame(3, $product->fresh()->stock);
        $this->assertDatabaseHas('sales', [
            'sale_no' => 'SAL-CUSTOM-001',
            'created_by' => $user->id,
            'total' => 190.00,
        ]);
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 100,
            'line_total' => 190.00,
        ]);
    }

    public function test_super_admin_can_create_sale_without_explicit_permissions(): void
    {
        $shop = $this->shop('DHA');
        $product = $this->product($shop, 'PTK-ADMIN-001', 5);
        $admin = $this->superAdmin();

        $this->actingAs($admin)->postJson('/api/v1/sales', [
            'sale_date' => '2026-11-21',
            'shop_id' => $shop->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 100],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.created_by', $admin->id)
            ->assertJsonPath('data.total', '100.00');

        $this->assertSame(4, $product->fresh()->stock);
        $this->assertSame(1, Sale::query()->count());
    }

    public function test_rejects_sale_when_stock_is_insufficient(): void
    {
        $shop = $this->shop('DHA');
        $product = $this->product($shop, 'PTK-002', 2);
        $user = $this->userWithRole('manager', $shop->id, ['sales.create']);

        $this->actingAs($user)->postJson('/api/v1/sales', [
            'sale_date' => '2026-11-21',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5, 'unit_price' => 100],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->assertSame(2, $product->fresh()->stock);
        $this->assertSame(0, Sale::query()->count());
    }

    public function test_manager_cannot_sell_products_from_another_shop(): void
    {
        $shopA = $this->shop('DHA');
        $shopB = $this->shop('CTG');
        $product = $this->product($shopB, 'PTK-003', 10);
        $user = $this->userWithRole('manager', $shopA->id, ['sales.create']);

        $this->actingAs($user)->postJson('/api/v1/sales', [
            'sale_date' => '2026-11-21',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 100],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('items');
    }

    public function test_generates_next_sale_number(): void
    {
        $shop = $this->shop('DHA');
        $user = $this->userWithRole('manager', $shop->id, ['sales.create']);

        $response = $this->actingAs($user)->getJson('/api/v1/sales/next-number')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertStringStartsWith('SAL-DHA'.now()->format('ymd'), $response->json('data.sale_no'));
    }

    public function test_returns_sale_restores_stock_and_blocks_duplicate_returns(): void
    {
        $shop = $this->shop('DHA');
        $product = $this->product($shop, 'PTK-004', 5);
        $user = $this->userWithRole('manager', $shop->id, ['sales.create', 'sales.return', 'sales.view']);
        $sale = Sale::create([
            'sale_no' => 'SAL-RETURN-001',
            'sale_date' => '2026-11-21',
            'shop_id' => $shop->id,
            'subtotal' => 100,
            'total' => 100,
            'paid_amount' => 100,
            'status' => 'completed',
            'created_by' => $user->id,
        ]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 2,
            'unit_price' => 50,
            'line_total' => 100,
        ]);
        Product::query()->whereKey($product->id)->decrement('stock', 2);
        $this->assertSame(3, $product->fresh()->stock);

        $this->actingAs($user)->postJson("/api/v1/sales/{$sale->id}/return", [
            'return_reason' => 'Customer changed mind',
        ])->assertOk()
            ->assertJsonPath('data.status', 'returned')
            ->assertJsonPath('data.refund_amount', '100.00')
            ->assertJsonPath('data.return_reason', 'Customer changed mind');

        $this->assertSame(5, $product->fresh()->stock);
        $this->assertNotNull($sale->fresh()->returned_at);

        $this->actingAs($user)->postJson("/api/v1/sales/{$sale->id}/return")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_super_admin_can_return_sale_without_explicit_permissions(): void
    {
        $shop = $this->shop('DHA');
        $product = $this->product($shop, 'PTK-ADMIN-002', 5);
        $admin = $this->superAdmin();
        $sale = Sale::create([
            'sale_no' => 'SAL-ADMIN-RETURN-001',
            'sale_date' => '2026-11-21',
            'shop_id' => $shop->id,
            'subtotal' => 100,
            'total' => 100,
            'paid_amount' => 100,
            'status' => 'completed',
            'created_by' => $admin->id,
        ]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 2,
            'unit_price' => 50,
            'line_total' => 100,
        ]);
        Product::query()->whereKey($product->id)->decrement('stock', 2);

        $this->actingAs($admin)->postJson("/api/v1/sales/{$sale->id}/return")
            ->assertOk()
            ->assertJsonPath('data.status', 'returned')
            ->assertJsonPath('data.refund_amount', '100.00');

        $this->assertSame(5, $product->fresh()->stock);
        $this->assertNotNull($sale->fresh()->returned_at);
    }

    public function test_authorized_user_can_download_sale_invoice_pdf(): void
    {
        $shop = $this->shop('SHA');
        $product = $this->product($shop, 'SKU-PDF', 10);
        $user = $this->userWithRole('super_admin', null, ['sales.view']);
        $sale = Sale::create([
            'sale_no' => 'SAL-PDF-001',
            'sale_date' => '2026-11-21',
            'shop_id' => $shop->id,
            'subtotal' => 100,
            'total' => 100,
            'paid_amount' => 100,
            'status' => 'completed',
            'created_by' => $user->id,
        ]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => 100,
            'line_total' => 100,
        ]);

        $response = $this->actingAs($user)->get("/api/v1/sales/{$sale->id}/pdf");

        $response->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename=sale-SAL-PDF-001.pdf');

        $content = $response->streamedContent();
        $this->assertStringStartsWith('%PDF-', $content);
        $this->assertStringContainsString('/Type /Page', $content);
        $this->assertGreaterThan(1000, strlen($content));
    }

    public function test_user_without_view_permission_cannot_download_sale_invoice_pdf(): void
    {
        $user = $this->userWithRole('manager', null, ['sales.create']);

        $this->actingAs($user)->get('/api/v1/sales/1/pdf')
            ->assertForbidden();
    }

    public function test_customers_all_endpoint_returns_selectable_customers(): void
    {
        $user = $this->userWithRole('manager', null, ['customers.view']);
        $customer = Customer::create(['name' => 'Selectable Customer', 'created_by' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/customers/all')
            ->assertOk()
            ->assertJsonPath('data.0.id', $customer->id)
            ->assertJsonPath('data.0.name', 'Selectable Customer');
    }

    private function shop(string $code): Shop
    {
        return Shop::create(['name' => "{$code} Shop", 'code' => $code]);
    }

    private function product(Shop $shop, string $sku, int $stock): Product
    {
        return Product::create([
            'created_by_shop_id' => $shop->id,
            'name' => 'Test Product '.$sku,
            'sku' => $sku,
            'price' => 100,
            'stock' => $stock,
            'is_active' => true,
        ]);
    }

    /** @param list<string> $permissions */
    private function userWithRole(string $roleName, ?int $shopId, array $permissions): User
    {
        Role::findOrCreate($roleName, 'web');
        $user = User::factory()->create(['shop_id' => $shopId]);
        $user->assignRole($roleName);

        $records = collect($permissions)->map(fn (string $name): Permission => Permission::findOrCreate($name, 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($records);

        return $user;
    }

    private function superAdmin(): User
    {
        Role::findOrCreate('super_admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super_admin');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
