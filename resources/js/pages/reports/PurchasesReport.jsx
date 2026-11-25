import { Badge } from '../../components/ui';
import ReportPage, { money } from './ReportPage';

const filters = [
    { key: 'shop_id', label: 'Shop', type: 'select', className: 'min-w-[360px] flex-1' },
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Purchase No, Reference No, Supplier…', className: 'min-w-[240px] flex-1' },
    { key: 'date_from', label: 'Date from', type: 'date', className: 'w-44' },
    { key: 'date_to', label: 'Date to', type: 'date', className: 'w-44' },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
        ],
    },
];

const columns = [
    { label: 'SL' },
    { label: 'Purchase No' },
    { label: 'Date' },
    { label: 'Supplier' },
    { label: 'Shop' },
    { label: 'Items' },
    { label: 'Subtotal' },
    { label: 'VAT' },
    { label: 'Total' },
    { label: 'Due' },
    { label: 'Status' },
];

const cards = [
    { key: 'total_purchases', label: 'Purchases' },
    { key: 'pending_purchases', label: 'Pending' },
    { key: 'approved_purchases', label: 'Approved' },
    { key: 'total_amount', label: 'Purchase Amount', format: 'money' },
    { key: 'total_due', label: 'Total Due', format: 'money' },
];

const renderRow = (purchase, index, currentPage, perPage) => (
    <tr key={purchase.id} className="text-center">
        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">{purchase.purchase_no}</td>
        <td className="whitespace-nowrap px-4 py-3">{purchase.purchase_date}</td>
        <td className="px-4 py-3 whitespace-nowrap">{purchase.supplier_name ?? '-'}</td>
        <td className="px-4 py-3 whitespace-nowrap">{purchase.shop_name ?? '-'}</td>
        <td className="px-4 py-3">{purchase.item_count}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(purchase.subtotal)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(purchase.vat)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(purchase.total)}</td>
        <td className="whitespace-nowrap px-4 py-3">
            <Badge tone={Number(purchase.due_amount) > 0 ? 'amber' : 'green'}>{money(purchase.due_amount)}</Badge>
        </td>
        <td className="px-4 py-3">
            <Badge tone={purchase.status === 'approved' ? 'green' : 'amber'}>
                {purchase.status === 'approved' ? 'Approved' : 'Pending'}
            </Badge>
        </td>
    </tr>
);

export default function PurchasesReport() {
    return (
        <ReportPage
            title="Purchase Report"
            subtitle="Purchase orders by date, supplier, and approval status"
            endpoint="/reports/purchases"
            exportEndpoint="/reports/purchases/export"
            filters={filters}
            columns={columns}
            cards={cards}
            renderRow={renderRow}
            emptyText="No purchases match the selected filters."
        />
    );
}
