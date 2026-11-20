<?php

namespace Tests\Feature;

use App\Models\PaymentType;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_creates_pending_order_and_stock_updates_only_after_approval(): void
    {
        $shop = $this->shop('SHA');
        $first = $this->product($shop, 'SKU-A', 'Product A', 5);
        $second = $this->product($shop, 'SKU-B', 'Product B', 3);
        $supplier = Supplier::create(['name' => 'Supplier A']);
        $paymentType = PaymentType::create(['name' => 'Cash', 'code' => 'cash']);
        $manager = $this->userWithRole('manager', $shop->id, ['purchases.view', 'purchases.create']);

        $response = $this->actingAs($manager)->postJson('/api/v1/purchases', [
            'purchase_date' => '2026-11-20',
            'supplier_id' => $supplier->id,
            'shop_id' => $shop->id,
            'payment_type_id' => $paymentType->id,
            'paid_amount' => 20,
            'items' => [
                ['product_id' => $first->id, 'quantity' => 2, 'unit_cost' => 10, 'vat_rate' => 5, 'discount' => 0],
                ['product_id' => $second->id, 'quantity' => 1, 'unit_cost' => 20, 'vat_rate' => 0, 'discount' => 5],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.subtotal', '40.00')
            ->assertJsonPath('data.discount', '5.00')
            ->assertJsonPath('data.vat', '1.00')
            ->assertJsonPath('data.total', '36.00')
            ->assertJsonPath('data.paid_amount', '20.00')
            ->assertJsonPath('data.due_amount', '16.00')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('purchase_items', 2);
        $this->assertDatabaseHas('purchase_items', ['product_id' => $first->id, 'quantity' => 2, 'line_total' => 21]);
        $this->assertDatabaseHas('purchase_items', ['product_id' => $second->id, 'quantity' => 1, 'line_total' => 15]);
        $this->assertSame(5, $first->fresh()->stock);
        $this->assertSame(3, $second->fresh()->stock);

        $purchase = Purchase::first();
        $admin = $this->userWithRole('super_admin', null, ['purchases.approve']);

        $this->actingAs($admin)->postJson("/api/v1/purchases/{$purchase->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.approved_by', $admin->id)
            ->assertJsonPath('data.approved_by_name', $admin->name);

        $this->assertSame(7, $first->fresh()->stock);
        $this->assertSame(4, $second->fresh()->stock);
        $this->assertNotNull($purchase->fresh()->approved_at);
    }

    public function test_manager_cannot_purchase_product_from_another_shop(): void
    {
        $ownShop = $this->shop('SHA');
        $otherShop = $this->shop('SHB');
        $otherProduct = $this->product($otherShop, 'SKU-B', 'Product B', 3);
        $user = $this->userWithRole('manager', $ownShop->id, ['purchases.view', 'purchases.create']);

        $this->actingAs($user)->postJson('/api/v1/purchases', [
            'purchase_date' => '2026-11-20',
            'shop_id' => $ownShop->id,
            'items' => [
                ['product_id' => $otherProduct->id, 'quantity' => 1, 'unit_cost' => 10],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->assertDatabaseCount('purchases', 0);
        $this->assertDatabaseCount('purchase_items', 0);
        $this->assertSame(3, $otherProduct->fresh()->stock);
    }

    public function test_manager_cannot_approve_purchase_order(): void
    {
        $shop = $this->shop('SHA');
        $product = $this->product($shop, 'SKU-A', 'Product A', 5);
        $manager = $this->userWithRole('manager', $shop->id, ['purchases.view', 'purchases.create']);
        $purchase = $this->purchase($shop, 'PUR-1', $product, $manager);

        $this->actingAs($manager)->postJson("/api/v1/purchases/{$purchase->id}/approve")->assertForbidden();

        $this->assertSame('pending', $purchase->fresh()->status);
        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_super_admin_cannot_approve_same_order_twice(): void
    {
        $shop = $this->shop('SHA');
        $product = $this->product($shop, 'SKU-A', 'Product A', 5);
        $manager = $this->userWithRole('manager', $shop->id, ['purchases.view', 'purchases.create']);
        $admin = $this->userWithRole('super_admin', null, ['purchases.approve']);
        $purchase = $this->purchase($shop, 'PUR-1', $product, $manager);

        $this->actingAs($admin)->postJson("/api/v1/purchases/{$purchase->id}/approve")->assertOk();
        $this->actingAs($admin)->postJson("/api/v1/purchases/{$purchase->id}/approve")->assertUnprocessable();

        $this->assertSame(7, $product->fresh()->stock);
    }

    public function test_products_all_returns_shop_specific_code_name_stock_and_price(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $this->product($shopA, 'SKU-A', 'Product A', 12);
        $this->product($shopB, 'SKU-B', 'Product B', 8);
        $manager = $this->userWithRole('manager', $shopA->id, ['products.view']);

        $this->actingAs($manager)->getJson("/api/v1/products/all?shop_id={$shopA->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'SKU-A')
            ->assertJsonPath('data.0.name', 'Product A')
            ->assertJsonPath('data.0.stock', 12)
            ->assertJsonPath('data.0.price', '10.00')
            ->assertJsonMissing(['sku' => 'SKU-B']);
    }

    public function test_manager_only_sees_own_shop_purchase_orders(): void
    {
        $shopA = $this->shop('SHA');
        $shopB = $this->shop('SHB');
        $productA = $this->product($shopA, 'SKU-A', 'Product A', 5);
        $productB = $this->product($shopB, 'SKU-B', 'Product B', 5);
        $manager = $this->userWithRole('manager', $shopA->id, ['purchases.view']);
        $this->purchase($shopA, 'PUR-SHA', $productA, $manager);
        $this->purchase($shopB, 'PUR-SHB', $productB, $manager);

        $this->actingAs($manager)->getJson('/api/v1/purchases')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.purchase_no', 'PUR-SHA')
            ->assertJsonMissing(['purchase_no' => 'PUR-SHB']);
    }

    public function test_viewer_cannot_record_purchase(): void
    {
        $shop = $this->shop('SHA');
        $product = $this->product($shop, 'SKU-A', 'Product A', 5);
        $user = $this->userWithRole('viewer', null, ['purchases.view']);

        $this->actingAs($user)->postJson('/api/v1/purchases', [
            'purchase_date' => '2026-11-20',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_cost' => 10],
            ],
        ])->assertForbidden();

        $this->assertDatabaseCount('purchases', 0);
    }

    /** @return array<string, array{string, string}> */
    public static function purchaseSearchTerms(): array
    {
        return [
            'purchase number' => ['PUR-100', 'PUR-100'],
            'reference number' => ['REF-200', 'PUR-200'],
            'supplier name' => ['acme', 'PUR-300'],
        ];
    }

    #[DataProvider('purchaseSearchTerms')]
    public function test_list_searches_purchase_number_reference_number_and_supplier_name(string $term, string $expectedPurchaseNo): void
    {
        $shop = $this->shop('SHA');
        $acme = Supplier::create(['name' => 'Acme Supply']);
        $other = Supplier::create(['name' => 'Other Supply']);
        $admin = $this->userWithRole('super_admin', null, ['purchases.view']);

        Purchase::factory()->create([
            'purchase_no' => 'PUR-100',
            'reference_no' => 'REF-100',
            'shop_id' => $shop->id,
            'supplier_id' => $other->id,
        ]);
        Purchase::factory()->create([
            'purchase_no' => 'PUR-200',
            'reference_no' => 'REF-200',
            'shop_id' => $shop->id,
            'supplier_id' => $other->id,
        ]);
        Purchase::factory()->create([
            'purchase_no' => 'PUR-300',
            'reference_no' => 'REF-300',
            'shop_id' => $shop->id,
            'supplier_id' => $acme->id,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/purchases?'.http_build_query(['search' => $term]));

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.purchase_no', $expectedPurchaseNo);
    }

    public function test_list_filters_purchases_by_purchase_date_range(): void
    {
        $shop = $this->shop('SHA');
        $admin = $this->userWithRole('super_admin', null, ['purchases.view']);

        Purchase::factory()->create(['purchase_no' => 'PUR-OLD', 'shop_id' => $shop->id, 'purchase_date' => '2026-11-10']);
        Purchase::factory()->create(['purchase_no' => 'PUR-FROM', 'shop_id' => $shop->id, 'purchase_date' => '2026-11-15']);
        Purchase::factory()->create(['purchase_no' => 'PUR-TO', 'shop_id' => $shop->id, 'purchase_date' => '2026-11-20']);
        Purchase::factory()->create(['purchase_no' => 'PUR-NEW', 'shop_id' => $shop->id, 'purchase_date' => '2026-11-25']);

        $response = $this->actingAs($admin)->getJson('/api/v1/purchases?date_from=2026-11-15&date_to=2026-11-20');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['purchase_no' => 'PUR-FROM'])
            ->assertJsonFragment(['purchase_no' => 'PUR-TO'])
            ->assertJsonMissing(['purchase_no' => 'PUR-OLD'])
            ->assertJsonMissing(['purchase_no' => 'PUR-NEW']);
    }

    public function test_list_rejects_date_range_when_end_is_before_start(): void
    {
        $admin = $this->userWithRole('super_admin', null, ['purchases.view']);

        $this->actingAs($admin)->getJson('/api/v1/purchases?date_from=2026-11-20&date_to=2026-11-15')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_to');
    }

    private function shop(string $code): Shop
    {
        return Shop::create(['name' => "{$code} Shop", 'code' => $code]);
    }

    private function product(Shop $shop, string $sku, string $name, int $stock): Product
    {
        return Product::create([
            'created_by_shop_id' => $shop->id,
            'name' => $name,
            'sku' => $sku,
            'price' => 10,
            'stock' => $stock,
            'is_active' => true,
        ]);
    }

    private function purchase(Shop $shop, string $purchaseNo, Product $product, User $creator): Purchase
    {
        $purchase = Purchase::create([
            'purchase_no' => $purchaseNo,
            'purchase_date' => '2026-11-20',
            'shop_id' => $shop->id,
            'subtotal' => 10,
            'total' => 10,
            'paid_amount' => 0,
            'due_amount' => 10,
            'status' => 'pending',
            'created_by' => $creator->id,
        ]);

        $purchase->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 2,
            'unit_cost' => 5,
            'line_total' => 10,
        ]);

        return $purchase;
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
}
