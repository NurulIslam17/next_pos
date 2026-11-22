import ReportPage, { money } from './ReportPage';

const filters = [
    { key: 'shop_id', label: 'Shop', type: 'select' },
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Invoice No, Customer, Reason…', className: 'min-w-[240px] flex-1' },
    { key: 'date_from', label: 'Return from', type: 'date', className: 'w-44' },
    { key: 'date_to', label: 'Return to', type: 'date', className: 'w-44' },
];

const columns = [
    { label: 'SL' },
    { label: 'Invoice No' },
    { label: 'Sale Date' },
    { label: 'Return Date' },
    { label: 'Customer' },
    { label: 'Shop' },
    { label: 'Items' },
    { label: 'Refund' },
    { label: 'Reason' },
];

const cards = [
    { key: 'total_returns', label: 'Returns' },
    { key: 'refunded_amount', label: 'Refunded', format: 'money' },
    { key: 'average_refund', label: 'Average Refund', format: 'money' },
];

const renderRow = (sale, index, currentPage, perPage) => (
    <tr key={sale.id} className="text-center">
        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">{sale.sale_no}</td>
        <td className="whitespace-nowrap px-4 py-3">{sale.sale_date}</td>
        <td className="whitespace-nowrap px-4 py-3">{sale.returned_at}</td>
        <td className="px-4 py-3">{sale.customer_name ?? 'Walk-in Customer'}</td>
        <td className="px-4 py-3">{sale.shop_name ?? '-'}</td>
        <td className="px-4 py-3">{sale.item_count}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(sale.refund_amount)}</td>
        <td className="px-4 py-3 text-left">{sale.return_reason ?? '-'}</td>
    </tr>
);

export default function SalesReturnReport() {
    return (
        <ReportPage
            title="Sales Return Report"
            subtitle="Returned sales and refunded amounts"
            endpoint="/reports/sales-returns"
            exportEndpoint="/reports/sales-returns/export"
            filters={filters}
            columns={columns}
            cards={cards}
            renderRow={renderRow}
            emptyText="No sales returns match the selected filters."
        />
    );
}
