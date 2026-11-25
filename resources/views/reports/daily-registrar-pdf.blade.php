<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28px 30px 34px 30px; }
        body { font-family: kalpurush; font-size: 9pt; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; }
        .header { background: #ecfdf5; padding: 10px 12px; margin-bottom: 12px; }
        .title { font-size: 16pt; font-weight: bold; color: #065f46; }
        .subtitle { font-size: 8pt; color: #6b7280; }
        .meta td { padding: 2px 0 4px 0; vertical-align: top; font-size: 9pt; }
        .label { width: 90px; color: #6b7280; font-size: 8pt; }
        .section { margin-top: 14px; }
        .section-title { font-size: 10pt; font-weight: bold; color: #111827; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #d1d5db; }
        .items thead th { background: #f3f4f6; color: #4b5563; font-size: 8pt; padding: 5px 4px; text-align: left; }
        .items tbody td, .items tfoot td { border-bottom: 0.5px solid #e5e7eb; padding: 5px 4px; font-size: 8.5pt; vertical-align: top; }
        .items tfoot td { font-weight: bold; background: #f9fafb; }
        .right { text-align: right; }
        .summary { margin-top: 16px; width: 50%; margin-left: auto; }
        .summary td { padding: 4px 6px; border-bottom: 0.5px solid #e5e7eb; }
        .summary .total { font-weight: bold; background: #ecfdf5; color: #065f46; }
        .empty { color: #6b7280; font-style: italic; padding: 6px 0; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="title">DAILY REGISTRAR REPORT</div>
                <div class="subtitle">Purchase, Expenses, and Sales</div>
            </td>
            <td class="right">
                <div class="subtitle">Generated</div>
                <div>{{ $generatedAt }}</div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td class="label">Date</td>
            <td>{{ $dateLabel }}</td>
            <td class="label">Shop</td>
            <td>{{ $shopLabel }}</td>
        </tr>
    </table>

    <div class="section">
        <div class="section-title">Purchases</div>
        @if(count($purchases))
        <table class="items">
            <thead><tr><th>#</th><th>Date</th><th>Purchase No</th><th>Supplier</th><th>Shop</th><th class="right">Items</th><th class="right">Total</th><th class="right">Paid</th><th>Status</th></tr></thead>
            <tbody>
            @foreach($purchases as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td><td>{{ $row['date'] }}</td><td>{{ $row['reference_no'] }}</td><td>{{ $row['party_name'] }}</td><td>{{ $row['shop_name'] }}</td><td class="right">{{ $row['item_count'] }}</td><td class="right">{{ $row['total'] }}</td><td class="right">{{ $row['paid_amount'] }}</td><td>{{ $row['status'] }}</td>
                </tr>
            @endforeach
            </tbody>
            <tfoot><tr><td colspan="6">Total Purchases</td><td class="right">{{ $summary['purchase_total'] }}</td><td class="right">{{ $summary['purchase_paid'] }}</td><td></td></tr></tfoot>
        </table>
        @else
            <div class="empty">No purchases for selected date.</div>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Expenses</div>
        @if(count($expenses))
        <table class="items">
            <thead><tr><th>#</th><th>Date</th><th>Category</th><th>Reference</th><th>Shop</th><th>Note</th><th class="right">Amount</th></tr></thead>
            <tbody>
            @foreach($expenses as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td><td>{{ $row['date'] }}</td><td>{{ $row['category'] }}</td><td>{{ $row['reference_no'] }}</td><td>{{ $row['shop_name'] }}</td><td>{{ $row['note'] }}</td><td class="right">{{ $row['amount'] }}</td>
                </tr>
            @endforeach
            </tbody>
            <tfoot><tr><td colspan="6">Total Expenses</td><td class="right">{{ $summary['expense_total'] }}</td></tr></tfoot>
        </table>
        @else
            <div class="empty">No expenses for selected date.</div>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Sales</div>
        @if(count($sales))
        <table class="items">
            <thead><tr><th>#</th><th>Date</th><th>Invoice No</th><th>Customer</th><th>Shop</th><th class="right">Items</th><th class="right">Total</th><th class="right">Paid</th><th>Status</th></tr></thead>
            <tbody>
            @foreach($sales as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td><td>{{ $row['date'] }}</td><td>{{ $row['reference_no'] }}</td><td>{{ $row['party_name'] }}</td><td>{{ $row['shop_name'] }}</td><td class="right">{{ $row['item_count'] }}</td><td class="right">{{ $row['total'] }}</td><td class="right">{{ $row['paid_amount'] }}</td><td>{{ $row['status'] }}</td>
                </tr>
            @endforeach
            </tbody>
            <tfoot><tr><td colspan="6">Total Sales</td><td class="right">{{ $summary['sales_total'] }}</td><td class="right">{{ $summary['sales_paid'] }}</td><td></td></tr></tfoot>
        </table>
        @else
            <div class="empty">No sales for selected date.</div>
        @endif
    </div>

    <table class="summary">
        <tr><td>Total Purchases</td><td class="right">{{ $summary['purchase_total'] }}</td></tr>
        <tr><td>Total Expenses</td><td class="right">{{ $summary['expense_total'] }}</td></tr>
        <tr><td>Total Sales</td><td class="right">{{ $summary['sales_total'] }}</td></tr>
        <tr class="total"><td>Net (Sales - Purchases - Expenses)</td><td class="right">{{ $summary['net_amount'] }}</td></tr>
    </table>
</body>
</html>
