<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 3mm 3mm 6mm 3mm;
        }

        body {
            font-family: kalpurush;
            font-size: 7.5pt;
            color: #111111;
            margin: 0;
            padding: 0;
        }

        h1 {
            font-size: 10pt;
            text-align: center;
            margin: 0 0 1mm 0;
            letter-spacing: 0.4mm;
        }

        .shop {
            font-weight: bold;
            text-align: center;
            margin: 0 0 2mm 0;
        }

        .rule {
            border-top: 0.25mm dashed #111111;
            margin: 1.5mm 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        td {
            padding: 0.3mm 0;
            vertical-align: top;
        }

        .label {
            width: 22mm;
        }

        .value {
            text-align: right;
        }

        .item {
            margin: 0 0 1.5mm 0;
        }

        .item-name {
            font-weight: bold;
            word-wrap: break-word;
        }

        .item-detail td {
            font-size: 7pt;
            color: #374151;
        }

        .totals td {
            padding: 0.4mm 0;
        }

        .grand td {
            border-top: 0.25mm dashed #111111;
            padding-top: 1mm;
            font-size: 8pt;
            font-weight: bold;
        }

        .due td {
            font-weight: bold;
        }

        .status {
            font-weight: bold;
        }

        .note {
            word-wrap: break-word;
        }

        .footer {
            margin-top: 2mm;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>SALES INVOICE</h1>
    <div class="shop">{{ $shop }}</div>
    <div class="rule"></div>

    <table>
        <tr>
            <td class="label">Invoice</td>
            <td class="value">{{ $saleNo }}</td>
        </tr>
        <tr>
            <td class="label">Date</td>
            <td class="value">{{ $saleDate }}</td>
        </tr>
        <tr>
            <td class="label">Customer</td>
            <td class="value">{{ $customer }}</td>
        </tr>
        <tr>
            <td class="label">Payment</td>
            <td class="value">{{ $paymentType }}</td>
        </tr>
        @if ($referenceNo !== '-')
            <tr>
                <td class="label">Reference</td>
                <td class="value">{{ $referenceNo }}</td>
            </tr>
        @endif
        <tr>
            <td class="label">Created By</td>
            <td class="value">{{ $createdBy }}</td>
        </tr>
    </table>

    <div class="rule"></div>

    @forelse ($items as $item)
        <div class="item">
            <div class="item-name">{{ $item['number'] }}. {{ $item['product'] }}</div>
            <table class="item-detail">
                <tr>
                    <td>{{ $item['sku'] }}</td>
                    <td class="value">{{ $item['quantity'] }} x {{ $item['unitPrice'] }}</td>
                    <td class="value">{{ $item['lineTotal'] }}</td>
                </tr>
            </table>
        </div>
    @empty
        <div>No items recorded.</div>
    @endforelse

    <div class="rule"></div>

    <table class="totals">
        <tr>
            <td>Subtotal</td>
            <td class="value">{{ $subtotal }}</td>
        </tr>
        <tr>
            <td>Discount</td>
            <td class="value">{{ $discount }}</td>
        </tr>
        <tr>
            <td>VAT</td>
            <td class="value">{{ $vat }}</td>
        </tr>
        <tr class="grand">
            <td>Total</td>
            <td class="value">{{ $total }}</td>
        </tr>
        <tr>
            <td>Paid</td>
            <td class="value">{{ $paid }}</td>
        </tr>
        <tr class="due">
            <td>Due</td>
            <td class="value">{{ $due }}</td>
        </tr>
    </table>

    @if ($status === 'RETURNED')
        <div class="rule"></div>
        <table>
            <tr class="status">
                <td>Status</td>
                <td class="value">RETURNED</td>
            </tr>
            <tr>
                <td>Returned At</td>
                <td class="value">{{ $returnedAt }}</td>
            </tr>
            <tr>
                <td>Refund</td>
                <td class="value">{{ $refund }}</td>
            </tr>
        </table>
    @endif

    @if ($note)
        <div class="rule"></div>
        <div class="note"><strong>Note:</strong> {{ $note }}</div>
    @endif

    <div class="rule"></div>
    <div class="footer">Thank you for your purchase.</div>
</body>
</html>
