<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        $sales = json_decode(file_get_contents(database_path('seeders/data/sales.json')), true, 512, JSON_THROW_ON_ERROR);
        $now = now()->toDateTimeString();

        $shop = DB::table('shops')->where('code', 'DHK')->first() ?? DB::table('shops')->orderBy('id')->first();
        $paymentType = DB::table('payment_types')->where('code', 'CASH')->first() ?? DB::table('payment_types')->orderBy('id')->first();
        $createdBy = DB::table('users')->where('shop_id', $shop?->id)->orderBy('id')->value('id')
            ?? DB::table('users')->orderBy('id')->value('id');

        if ($shop === null || $paymentType === null || $createdBy === null) {
            throw new RuntimeException('SaleSeeder requires shops, payment types, and users to be seeded first.');
        }

        $customerIds = DB::table('customers')->pluck('id', 'name');
        $missingCustomerNames = array_diff(
            array_values(array_unique(array_column($sales, 'customer_name'))),
            $customerIds->keys()->all(),
        );

        if ($missingCustomerNames !== []) {
            DB::table('customers')->insert(array_map(
                fn (string $name): array => [
                    'name' => $name,
                    'created_by' => $createdBy,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                $missingCustomerNames,
            ));

            $customerIds = DB::table('customers')->pluck('id', 'name');
        }

        $productIds = DB::table('products')->pluck('id', 'sku');
        $missingProducts = [];

        foreach ($sales as $sale) {
            foreach ($sale['items'] as $item) {
                if (isset($productIds[$item['sku']]) || isset($missingProducts[$item['sku']])) {
                    continue;
                }

                $missingProducts[$item['sku']] = [
                    'created_by_shop_id' => $shop->id,
                    'name' => $item['name'],
                    'sku' => $item['sku'],
                    'cost_price' => $item['cost_price'],
                    'price' => $item['unit_price'],
                    'stock' => 0,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($missingProducts !== []) {
            DB::table('products')->insert(array_values($missingProducts));
            $productIds = DB::table('products')->pluck('id', 'sku');
        }

        $saleRows = array_map(
            fn (array $sale): array => [
                'sale_no' => $sale['sale_no'],
                'sale_date' => substr($sale['sale_date'], 0, 10),
                'customer_id' => $customerIds[$sale['customer_name']] ?? null,
                'shop_id' => $shop->id,
                'payment_type_id' => $paymentType->id,
                'subtotal' => $sale['subtotal'],
                'discount' => $sale['discount'],
                'vat' => $sale['vat'],
                'total' => $sale['total'],
                'paid_amount' => $sale['paid_amount'],
                'due_amount' => $sale['due_amount'],
                'status' => 'completed',
                'refund_amount' => 0,
                'created_by' => $createdBy,
                'created_at' => $sale['sale_date'],
                'updated_at' => $sale['sale_date'],
            ],
            $sales,
        );

        $updateColumns = [
            'sale_date', 'customer_id', 'shop_id', 'payment_type_id', 'subtotal', 'discount',
            'vat', 'total', 'paid_amount', 'due_amount', 'status', 'refund_amount', 'created_by', 'updated_at',
        ];

        foreach (array_chunk($saleRows, 500) as $chunk) {
            DB::table('sales')->upsert($chunk, ['sale_no'], $updateColumns);
        }

        foreach (array_chunk($sales, 500) as $chunk) {
            $saleIds = DB::table('sales')
                ->whereIn('sale_no', array_column($chunk, 'sale_no'))
                ->pluck('id', 'sale_no');

            DB::table('sale_items')->whereIn('sale_id', $saleIds->values()->all())->delete();

            $itemRows = [];

            foreach ($chunk as $sale) {
                if (! isset($saleIds[$sale['sale_no']])) {
                    continue;
                }

                foreach ($sale['items'] as $item) {
                    $itemRows[] = [
                        'sale_id' => $saleIds[$sale['sale_no']],
                        'product_id' => $productIds[$item['sku']] ?? null,
                        'product_name' => $item['name'],
                        'product_sku' => $item['sku'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'vat_rate' => $sale['vat_rate'],
                        'discount' => $item['discount'],
                        'line_total' => $item['line_total'],
                        'created_at' => $sale['sale_date'],
                        'updated_at' => $sale['sale_date'],
                    ];
                }
            }

            foreach (array_chunk($itemRows, 1000) as $itemChunk) {
                DB::table('sale_items')->insert($itemChunk);
            }
        }
    }
}
