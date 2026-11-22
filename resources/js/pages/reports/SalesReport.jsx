import { Badge } from '../../components/ui';
import ReportPage, { money } from './ReportPage';

const filters = [
    { key: 'shop_id', label: 'Shop', type: 'select' },
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Invoice No, Reference No, Customer…', className: 'min-w-[240px] flex-1' },
    { key: 'date_from', label: 'Date from', type: 'date', className: 'w-44' },
    { key: 'date_to', label: 'Date to', type: 'date', className: 'w-44' },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: 'completed', label: 'Completed' },
            { value: 'returned', label: 'Returned' },
        ],
    },
];

const columns = [
    { label: 'SL' },
    { label: 'Invoice No' },
    { label: 'Date' },
    { label: 'Customer' },
    { label: 'Shop' },
    { label: 'Items' },
    { label: 'Subtotal' },
    { label: 'VAT' },
    { label: 'Total' },
    { label: 'Due' },
    { label: 'Status' },
];

const cards = [
    { key: 'total_sales', label: 'Sales' },
    { key: 'sales_amount', label: 'Sales Amount', format: 'money' },
    { key: 'returned_sales', label: 'Returned' },
    { key: 'refunded_amount', label: 'Refunded', format: 'money' },
    { key: 'due_amount', label: 'Total Due', format: 'money' },
];

const renderRow = (sale, index, currentPage, perPage) => (
    <tr key={sale.id} className="text-center">
        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">{sale.sale_no}</td>
        <td className="whitespace-nowrap px-4 py-3">{sale.sale_date}</td>
        <td className="px-4 py-3">{sale.customer_name ?? 'Walk-in Customer'}</td>
        <td className="px-4 py-3">{sale.shop_name ?? '-'}</td>
        <td className="px-4 py-3">{sale.item_count}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(sale.subtotal)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(sale.vat)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(sale.total)}</td>
        <td className="whitespace-nowrap px-4 py-3">
            <Badge tone={Number(sale.due_amount) > 0 ? 'amber' : 'green'}>{money(sale.due_amount)}</Badge>
        </td>
        <td className="px-4 py-3">
            <Badge tone={sale.status === 'returned' ? 'amber' : 'green'}>
                {sale.status === 'returned' ? 'Returned' : 'Completed'}
            </Badge>
        </td>
    </tr>
);

export default function SalesReport() {
    return (
        <ReportPage
            title="Sales Report"
            subtitle="Sales performance by date, customer, and status"
            endpoint="/reports/sales"
            exportEndpoint="/reports/sales/export"
            filters={filters}
            columns={columns}
            cards={cards}
            renderRow={renderRow}
            emptyText="No sales match the selected filters."
        />
    );
}
