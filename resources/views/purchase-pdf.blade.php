<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 36px 36px 40px 36px;
        }

        body {
            font-family: kalpurush;
            font-size: 9pt;
            color: #1f2937;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .header {
            background-color: #eef2ff;
            padding: 10px 12px;
        }

        .header-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
        }

        .header-caption {
            font-size: 8pt;
            color: #6b7280;
            text-align: right;
        }

        .header-number {
            font-size: 10pt;
            font-weight: bold;
            color: #111827;
        }

        .header-status {
            font-size: 9pt;
            font-weight: bold;
            color: #b45309;
            text-align: right;
        }

        .header-status.approved {
            color: #047857;
        }

        .meta {
            margin-top: 14px;
        }

        .meta td {
            padding: 2px 0 4px 0;
            vertical-align: top;
        }

        .label {
            width: 88px;
            color: #6b7280;
            font-size: 8pt;
        }

        .value {
            color: #111827;
            font-size: 9pt;
        }

        .items {
            margin-top: 12px;
        }

        .items thead th {
            background-color: #f3f4f6;
            color: #4b5563;
            font-size: 8pt;
            padding: 6px 4px;
            text-align: center;
        }

        .items tbody td {
            border-bottom: 0.5px solid #e5e7eb;
            padding: 7px 4px 5px 4px;
            text-align: center;
            vertical-align: top;
        }

        .items thead th:last-child,
        .items tbody td:last-child {
            text-align: right;
        }

        .right {
            text-align: right;
        }

        .totals {
            margin-top: 10px;
        }

        .totals td {
            padding: 2px 4px;
            font-size: 9pt;
        }

        .totals .total-label {
            width: 70%;
            text-align: right;
            color: #374151;
        }

        .totals .total-value {
            width: 30%;
            text-align: right;
            color: #111827;
        }

        .totals .emphasis {
            font-weight: bold;
            color: #1e3a8a;
        }

        .note {
            margin-top: 12px;
            color: #4b5563;
            font-size: 9pt;
        }

        .note-label {
            font-weight: bold;
            color: #374151;
        }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="header-title">PURCHASE ORDER</div>
                <div class="header-number">{{ $purchaseNo }}</div>
            </td>
            <td>
                <div class="header-caption">PURCHASE DETAILS</div>
                <div class="header-status {{ $status === 'APPROVED' ? 'approved' : '' }}">{{ $status }}</div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td class="label">Purchase Date</td>
            <td class="value">{{ $purchaseDate }}</td>
            <td class="label">Supplier</td>
            <td class="value">{{ $supplier }}</td>
        </tr>
        <tr>
            <td class="label">Shop</td>
            <td class="value">{{ $shop }}</td>
            <td class="label">Payment Type</td>
            <td class="value">{{ $paymentType }}</td>
        </tr>
        <tr>
            <td class="label">Reference No</td>
            <td class="value">{{ $referenceNo }}</td>
            <td class="label">Created By</td>
            <td class="value">{{ $createdBy }}</td>
        </tr>
        <tr>
            <td class="label">Approved By</td>
            <td class="value">{{ $approvedBy }}</td>
            <td class="label">Approved At</td>
            <td class="value">{{ $approvedAt }}</td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 28%;">Product</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 6%;" class="right">Qty</th>
                <th style="width: 13%;" class="right">Unit Cost</th>
                <th style="width: 8%;" class="right">VAT</th>
                <th style="width: 12%;" class="right">Discount</th>
                <th style="width: 14%;" class="right">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($items as $item)
                <tr>
                    <td class="right">{{ $item['number'] }}</td>
                    <td>{{ $item['product'] }}</td>
                    <td>{{ $item['sku'] }}</td>
                    <td class="right">{{ $item['quantity'] }}</td>
                    <td class="right">{{ $item['unitCost'] }}</td>
                    <td class="right">{{ $item['vatRate'] }}</td>
                    <td class="right">{{ $item['discount'] }}</td>
                    <td class="right">{{ $item['lineTotal'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">No items recorded.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td></td>
            <td class="total-label">Subtotal</td>
            <td class="total-value">{{ $subtotal }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="total-label">Discount</td>
            <td class="total-value">{{ $discount }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="total-label">VAT</td>
            <td class="total-value">{{ $vat }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="total-label emphasis">Grand Total</td>
            <td class="total-value emphasis">{{ $total }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="total-label">Paid</td>
            <td class="total-value">{{ $paid }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="total-label emphasis">Due</td>
            <td class="total-value emphasis">{{ $due }}</td>
        </tr>
    </table>

    @if ($note)
        <div class="note"><span class="note-label">Note:</span> {{ $note }}</div>
    @endif
</body>
</html>
