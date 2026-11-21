<?php

namespace Database\Seeders;

use App\Models\PaymentType;
use App\Models\Purchase;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $purchases = json_decode(file_get_contents(database_path('seeders/data/purchases.json')), true);
        $supplierIds = Supplier::query()->get(['id', 'name'])->mapWithKeys(fn (Supplier $supplier): array => [Str::lower($supplier->name) => $supplier->id])->all();
        $paymentTypeIds = PaymentType::query()->pluck('id', 'code');
        $paymentTypeCodes = [
            'Cash' => 'CASH',
            'Cheque' => 'BANK',
            'Bkash' => 'MOBILE',
            'Card' => 'CARD',
        ];
        $shopId = Shop::query()->value('id');
        $userId = User::query()->where('email', 'superadmin@pos.test')->value('id') ?? User::query()->value('id');

        $rows = array_map(function (array $purchase) use ($paymentTypeCodes, $paymentTypeIds, $shopId, $supplierIds, $userId): array {
            $paymentMethod = $purchase['payment_method'];
            $paymentTypeCode = $paymentTypeCodes[$paymentMethod] ?? null;
            $purchaseDate = $purchase['purchase_date'];

            return [
                'purchase_no' => $purchase['purchase_no'],
                'purchase_date' => $purchaseDate,
                'supplier_id' => $supplierIds[Str::lower($purchase['supplier_name'])] ?? null,
                'shop_id' => $shopId,
                'payment_type_id' => $paymentTypeCode ? ($paymentTypeIds[$paymentTypeCode] ?? null) : null,
                'reference_no' => $purchase['reference_no'],
                'subtotal' => $purchase['subtotal'],
                'discount' => $purchase['discount'],
                'vat' => $purchase['vat'],
                'total' => $purchase['total'],
                'paid_amount' => $purchase['paid_amount'],
                'due_amount' => $purchase['due_amount'],
                'status' => $purchase['status'],
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => $purchaseDate,
                'created_at' => $purchaseDate,
                'updated_at' => $purchaseDate,
            ];
        }, $purchases);

        foreach (array_chunk($rows, 500) as $chunk) {
            Purchase::upsert($chunk, ['purchase_no'], [
                'purchase_date',
                'supplier_id',
                'shop_id',
                'payment_type_id',
                'reference_no',
                'subtotal',
                'discount',
                'vat',
                'total',
                'paid_amount',
                'due_amount',
                'status',
                'created_by',
                'approved_by',
                'approved_at',
                'updated_at',
            ]);
        }
    }
}
