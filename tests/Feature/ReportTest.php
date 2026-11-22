<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\PaymentType;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public static function reportEndpoints(): array
    {
        return [
            'stocks' => ['/api/v1/reports/stocks'],
            'purchases' => ['/api/v1/reports/purchases'],
            'sales' => ['/api/v1/reports/sales'],
            'sales returns' => ['/api/v1/reports/sales-returns'],
        ];
    }

    public static function reportExportEndpoints(): array
    {
        return [
            'stocks' => ['/api/v1/reports/stocks/export'],
            'purchases' => ['/api/v1/reports/purchases/export'],
            'sales' => ['/api/v1/reports/sales/export'],
            'sales returns' => ['/api/v1/reports/sales-returns/export'],
        ];
    }

    #[DataProvider('reportEndpoints')]
    public function test_returns_401_when_unauthenticated(string $endpoint): void
    {
        $this->getJson($endpoint)->assertUnauthorized();
    }

    #[DataProvider('reportEndpoints')]
    public function test_forbids_user_without_reports_view_permission(string $endpoint): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson($endpoint)->assertForbidden();
    }

    #[DataProvider('reportExportEndpoints')]
    public function test_returns_401_when_exporting_unauthenticated(string $endpoint): void
    {
        $this->getJson($endpoint)->assertUnauthorized();
    }

    #[DataProvider('reportExportEndpoints')]
    public function test_forbids_export_without_reports_view_permission(string $endpoint): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson($endpoint)->assertForbidden();
    }

    public function test_rejects_invalid_date_range(): void
    {
        $user = $this->userWithPermission();

        $this->actingAs($user)
            ->getJson('/api/v1/reports/sales?date_from=2026-11-20&date_to=2026-11-10')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_to']);
    }

    public function test_rejects_invalid_report_filters(): void
    {
        $user = $this->userWithPermission();

        $this->actingAs($user)
            ->getJson('/api/v1/reports/stocks?stock_status=unknown')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['stock_status']);

        $this->actingAs($user)
            ->getJson('/api/v1/reports/purchases?status=unknown')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_rejects_unknown_shop_filter(): void
    {
        $user = $this->userWithPermission();

        $this->actingAs($user)
            ->getJson('/api/v1/reports/stocks?shop_id=999999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['shop_id']);
    }

    public function test_returns_filtered_stock_report_with_summary(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $category = Category::factory()->create(['name' => 'Drinks']);

        $this->createProduct($shop->id, $category->id, 'LOW-SKU', 5, 10);
        $this->createProduct($shop->id, $category->id, 'IN-SKU', 50, 10);
        $this->createProduct($shop->id, $category->id, 'OUT-SKU', 0, 10);

        $response = $this->actingAs($user)->getJson('/api/v1/reports/stocks?stock_status=low');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.sku', 'LOW-SKU')
            ->assertJsonPath('data.0.stock_status', 'low')
            ->assertJsonPath('summary.total_products', 1)
            ->assertJsonPath('summary.low_stock_products', 1)
            ->assertJsonPath('summary.total_stock_value', 50)
            ->assertJsonMissing(['sku' => 'IN-SKU'])
            ->assertJsonMissing(['sku' => 'OUT-SKU']);
    }

    public function test_manager_only_sees_own_shop_in_stock_report(): void
    {
        $shopA = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $shopB = Shop::create(['name' => 'Shop B', 'code' => 'SHB']);
        $manager = $this->userWithPermission($shopA->id);
        $manager->assignRole(Role::findOrCreate('manager', 'web'));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->createProduct($shopA->id, null, 'SHA-PRODUCT', 10, 5);
        $this->createProduct($shopB->id, null, 'SHB-PRODUCT', 10, 5);

        $this->actingAs($manager)
            ->getJson('/api/v1/reports/stocks?shop_id='.$shopB->id)
            ->assertOk()
            ->assertJsonPath('summary.total_products', 1)
            ->assertJsonPath('data.0.sku', 'SHA-PRODUCT')
            ->assertJsonMissing(['sku' => 'SHB-PRODUCT']);
    }

    public function test_returns_filtered_purchase_report_with_summary(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $supplier = Supplier::factory()->create(['name' => 'Acme']);

        $purchase = Purchase::factory()->create([
            'purchase_no' => 'PUR-IN',
            'purchase_date' => '2026-11-10',
            'supplier_id' => $supplier->id,
            'shop_id' => $shop->id,
            'subtotal' => 100,
            'vat' => 5,
            'total' => 105,
            'paid_amount' => 5,
            'due_amount' => 100,
            'status' => 'approved',
        ]);
        PurchaseItem::factory()->create(['purchase_id' => $purchase->id]);

        Purchase::factory()->create([
            'purchase_no' => 'PUR-OUT',
            'purchase_date' => '2026-10-10',
            'supplier_id' => $supplier->id,
            'shop_id' => $shop->id,
            'status' => 'pending',
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/reports/purchases?date_from=2026-11-01&date_to=2026-11-30')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.purchase_no', 'PUR-IN')
            ->assertJsonPath('data.0.item_count', 1)
            ->assertJsonPath('data.0.supplier_name', 'Acme')
            ->assertJsonPath('summary.total_purchases', 1)
            ->assertJsonPath('summary.approved_purchases', 1)
            ->assertJsonPath('summary.total_amount', 105)
            ->assertJsonPath('summary.total_due', 100)
            ->assertJsonMissing(['purchase_no' => 'PUR-OUT']);
    }

    public function test_returns_filtered_sales_report_with_summary(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $customer = Customer::factory()->create(['name' => 'Alice']);

        $completed = Sale::factory()->create([
            'sale_no' => 'SAL-COMPLETED',
            'sale_date' => '2026-11-12',
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'total' => 200,
            'due_amount' => 20,
            'status' => 'completed',
        ]);
        SaleItem::factory()->create(['sale_id' => $completed->id]);

        Sale::factory()->create([
            'sale_no' => 'SAL-RETURNED',
            'sale_date' => '2026-11-13',
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'status' => 'returned',
            'refund_amount' => 50,
            'returned_at' => '2026-11-14 10:00:00',
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/reports/sales?date_from=2026-11-01&date_to=2026-11-30&status=completed')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.sale_no', 'SAL-COMPLETED')
            ->assertJsonPath('data.0.item_count', 1)
            ->assertJsonPath('data.0.customer_name', 'Alice')
            ->assertJsonPath('summary.total_sales', 1)
            ->assertJsonPath('summary.completed_sales', 1)
            ->assertJsonPath('summary.sales_amount', 200)
            ->assertJsonPath('summary.due_amount', 20)
            ->assertJsonMissing(['sale_no' => 'SAL-RETURNED']);
    }

    public function test_returns_sales_return_report_filtered_by_return_date(): void
    {
        $user = $this->userWithPermission();
        $shop = Shop::create(['name' => 'Shop A', 'code' => 'SHA']);
        $customer = Customer::factory()->create(['name' => 'Alice']);
        $paymentType = PaymentType::factory()->create();

        $returned = Sale::factory()->create([
            'sale_no' => 'SAL-RETURN',
            'sale_date' => '2026-11-10',
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'payment_type_id' => $paymentType->id,
            'status' => 'returned',
            'refund_amount' => 80,
            'return_reason' => 'Damaged item',
            'returned_at' => '2026-11-15 10:30:00',
        ]);
        SaleItem::factory()->create(['sale_id' => $returned->id]);

        Sale::factory()->create([
            'sale_no' => 'SAL-KEEP',
            'sale_date' => '2026-11-10',
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'status' => 'completed',
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/reports/sales-returns?date_from=2026-11-15&date_to=2026-11-15')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.sale_no', 'SAL-RETURN')
            ->assertJsonPath('data.0.refund_amount', '80.00')
            ->assertJsonPath('data.0.return_reason', 'Damaged item')
            ->assertJsonPath('summary.total_returns', 1)
            ->assertJsonPath('summary.refunded_amount', 80)
            ->assertJsonPath('summary.average_refund', 80)
            ->assertJsonMissing(['sale_no' => 'SAL-KEEP']);
    }

    public function test_filters_stock_report_by_shop(): void
    {
        $user = $this->userWithPermission();
        $shopA = $this->shop('SHA', 'Shop A');
        $shopB = $this->shop('SHB', 'Shop B');

        $this->createProduct($shopA->id, null, 'SHA-STOCK', 10, 5);
        $this->createProduct($shopB->id, null, 'SHB-STOCK', 10, 5);

        $this->actingAs($user)
            ->getJson('/api/v1/reports/stocks?shop_id='.$shopA->id)
            ->assertOk()
            ->assertJsonPath('summary.total_products', 1)
            ->assertJsonPath('data.0.sku', 'SHA-STOCK')
            ->assertJsonMissing(['sku' => 'SHB-STOCK']);
    }

    public function test_filters_purchase_report_by_shop(): void
    {
        $user = $this->userWithPermission();
        $shopA = $this->shop('SHA', 'Shop A');
        $shopB = $this->shop('SHB', 'Shop B');

        $this->createPurchase($shopA, 'SHA-PUR');
        $this->createPurchase($shopB, 'SHB-PUR');

        $this->actingAs($user)
            ->getJson('/api/v1/reports/purchases?shop_id='.$shopA->id)
            ->assertOk()
            ->assertJsonPath('summary.total_purchases', 1)
            ->assertJsonPath('data.0.purchase_no', 'SHA-PUR')
            ->assertJsonMissing(['purchase_no' => 'SHB-PUR']);
    }

    public function test_filters_sales_report_by_shop(): void
    {
        $user = $this->userWithPermission();
        $shopA = $this->shop('SHA', 'Shop A');
        $shopB = $this->shop('SHB', 'Shop B');

        $this->createSale($shopA, 'SHA-SAL');
        $this->createSale($shopB, 'SHB-SAL');

        $this->actingAs($user)
            ->getJson('/api/v1/reports/sales?shop_id='.$shopA->id)
            ->assertOk()
            ->assertJsonPath('summary.total_sales', 1)
            ->assertJsonPath('data.0.sale_no', 'SHA-SAL')
            ->assertJsonMissing(['sale_no' => 'SHB-SAL']);
    }

    public function test_filters_sales_return_report_by_shop(): void
    {
        $user = $this->userWithPermission();
        $shopA = $this->shop('SHA', 'Shop A');
        $shopB = $this->shop('SHB', 'Shop B');

        $this->createSale($shopA, 'SHA-RET', 'returned');
        $this->createSale($shopB, 'SHB-RET', 'returned');

        $this->actingAs($user)
            ->getJson('/api/v1/reports/sales-returns?shop_id='.$shopA->id)
            ->assertOk()
            ->assertJsonPath('summary.total_returns', 1)
            ->assertJsonPath('data.0.sale_no', 'SHA-RET')
            ->assertJsonMissing(['sale_no' => 'SHB-RET']);
    }

    public function test_exports_stock_report_csv(): void
    {
        $user = $this->userWithPermission();
        $shop = $this->shop('CSV', 'CSV Shop');
        $this->createProduct($shop->id, null, 'CSV-SKU', 5, 10);

        $response = $this->actingAs($user)->get('/api/v1/reports/stocks/export?stock_status=low');

        $response->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename=stocks-report-exported-'.now()->toDateString().'.csv');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('SKU,Product,Category,Shop', $content);
        $this->assertStringContainsString('CSV-SKU', $content);
        $this->assertStringContainsString('CSV Shop', $content);
    }

    public function test_exports_purchase_report_csv(): void
    {
        $user = $this->userWithPermission();
        $shop = $this->shop('CSV', 'CSV Shop');
        $firstPurchase = $this->createPurchase($shop, 'CSV-PUR');
        $secondPurchase = $this->createPurchase($shop, 'CSV-PUR-2', 'approved', 50);
        PurchaseItem::factory()->create(['purchase_id' => $firstPurchase->id]);
        PurchaseItem::factory()->count(2)->create(['purchase_id' => $secondPurchase->id]);

        $response = $this->actingAs($user)->get('/api/v1/reports/purchases/export?date_from=2026-11-01&date_to=2026-11-30');

        $response->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename=purchases-report-exported-'.now()->toDateString().'-from-2026-11-01-to-2026-11-30.csv');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('"Purchase No",Date,Supplier,Shop', $content);
        $this->assertStringNotContainsString('Status', $content);
        $this->assertStringNotContainsString('Approved At', $content);
        $this->assertStringContainsString('CSV-PUR', $content);
        $this->assertStringContainsString('CSV Shop', $content);
        $this->assertStringContainsString('Total,,,,,150.00,,0.00,150.00,150.00,,3', $content);
    }

    public function test_exports_sales_report_csv(): void
    {
        $user = $this->userWithPermission();
        $shop = $this->shop('CSV', 'CSV Shop');
        $product = $this->createProduct($shop->id, null, 'CSV-ITEM-SKU', 0, 0);
        $sale = $this->createSale($shop, 'CSV-SAL');

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 2,
            'unit_price' => 50,
            'vat_rate' => 0,
            'discount' => 0,
            'line_total' => 100,
        ]);

        $response = $this->actingAs($user)->get('/api/v1/reports/sales/export');

        $response->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename=sales-report-exported-'.now()->toDateString().'.csv');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Detailed Sale Report', $content);
        $this->assertStringContainsString('SN,Date,"Invoice No",Customer,"Item Details"', $content);
        $this->assertStringContainsString('"Purchase Price","Selling Price",Discount,Qty,VAT', $content);
        $this->assertStringContainsString('(Serial)', $content);
        $this->assertStringContainsString('CSV-ITEM-SKU', $content);
        $this->assertStringContainsString('CSV-SAL', $content);
        $this->assertStringContainsString(',,,,,Total,=SUM(G9:G9),=SUM(H9:H9),=SUM(I9:I9),=SUM(J9:J9),=SUM(K9:K9),=SUM(L9:L9),=SUM(M9:M9),=SUM(N9:N9),=SUM(O9:O9)', $content);
    }

    public function test_exports_sales_return_report_csv(): void
    {
        $user = $this->userWithPermission();
        $shop = $this->shop('CSV', 'CSV Shop');
        $this->createSale($shop, 'CSV-RET', 'returned');

        $response = $this->actingAs($user)->get('/api/v1/reports/sales-returns/export');

        $response->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename=sales-returns-report-exported-'.now()->toDateString().'.csv');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('"Sale No","Sale Date","Returned At"', $content);
        $this->assertStringContainsString('CSV-RET', $content);
        $this->assertStringContainsString('CSV Shop', $content);
    }

    private function shop(string $code, string $name): Shop
    {
        return Shop::create(['name' => $name, 'code' => $code]);
    }

    private function createPurchase(Shop $shop, string $purchaseNo, string $status = 'approved', float $total = 100): Purchase
    {
        $supplier = Supplier::factory()->create();

        return Purchase::factory()->create([
            'purchase_no' => $purchaseNo,
            'purchase_date' => '2026-11-10',
            'supplier_id' => $supplier->id,
            'shop_id' => $shop->id,
            'subtotal' => $total,
            'discount' => 0,
            'vat' => 0,
            'total' => $total,
            'paid_amount' => $total,
            'due_amount' => 0,
            'status' => $status,
        ]);
    }

    private function createSale(Shop $shop, string $saleNo, string $status = 'completed'): Sale
    {
        $customer = Customer::factory()->create();
        $isReturned = $status === 'returned';

        return Sale::factory()->create([
            'sale_no' => $saleNo,
            'sale_date' => '2026-11-12',
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'subtotal' => 100,
            'vat' => 0,
            'total' => 100,
            'due_amount' => 0,
            'status' => $status,
            'refund_amount' => $isReturned ? 50 : 0,
            'returned_at' => $isReturned ? '2026-11-15 10:00:00' : null,
        ]);
    }

    private function createProduct(int $shopId, ?int $categoryId, string $sku, int $stock, int $stockAlert): Product
    {
        return Product::create([
            'created_by_shop_id' => $shopId,
            'category_id' => $categoryId,
            'name' => 'Product '.$sku,
            'sku' => $sku,
            'cost_price' => 10,
            'price' => 20,
            'stock' => $stock,
            'stock_alert' => $stockAlert,
            'is_active' => true,
        ]);
    }

    private function userWithPermission(?int $shopId = null): User
    {
        $user = User::factory()->create(['shop_id' => $shopId]);
        $permission = Permission::findOrCreate('reports.view', 'web');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permission);

        return $user;
    }
}
