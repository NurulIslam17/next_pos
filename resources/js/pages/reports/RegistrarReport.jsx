import { Badge } from '../../components/ui';
import ReportPage, { money } from './ReportPage';

const filters = [
    { key: 'shop_id', label: 'Shop', type: 'select', className: 'min-w-[350px] flex-1' },
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Reference No, Party…', className: 'min-w-[240px] flex-1' },
    { key: 'date_from', label: 'Date from', type: 'date', className: 'w-44' },
    { key: 'date_to', label: 'Date to', type: 'date', className: 'w-44' },
];

const columns = [
    { label: 'SL' },
    { label: 'Date' },
    { label: 'Type' },
    { label: 'Reference' },
    { label: 'Party' },
    { label: 'Shop' },
    { label: 'Items' },
    { label: 'Subtotal' },
    { label: 'Discount' },
    { label: 'VAT' },
    { label: 'Total' },
    { label: 'Paid' },
    { label: 'Due' },
    { label: 'Status' },
    { label: 'Net' },
];

const cards = [
    { key: 'total_transactions', label: 'Transactions' },
    { key: 'purchase_count', label: 'Purchases' },
    { key: 'sale_count', label: 'Sales' },
    { key: 'return_count', label: 'Returns' },
    { key: 'net_amount', label: 'Net Amount', format: 'money' },
];

const typeTone = (type) =>
    ({ Purchase: 'amber', Sale: 'green', 'Sale Return': 'slate' })[type] ?? 'slate';

const renderRow = (transaction, index, currentPage, perPage) => (
    <tr key={transaction.id} className="text-center">
        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
        <td className="whitespace-nowrap px-4 py-3">{transaction.date}</td>
        <td className="px-4 py-3 whitespace-nowrap">
            <Badge tone={typeTone(transaction.type)}>{transaction.type}</Badge>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">{transaction.reference_no}</td>
        <td className="px-4 py-3 whitespace-nowrap">{transaction.party_name ?? '-'}</td>
        <td className="px-4 py-3 whitespace-nowrap">{transaction.shop_name ?? '-'}</td>
        <td className="px-4 py-3">{transaction.item_count}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.subtotal)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.discount)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.vat)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.total)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.paid_amount)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(transaction.due_amount)}</td>
        <td className="px-4 py-3">{transaction.status}</td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">{money(transaction.net_amount)}</td>
    </tr>
);

export default function RegistrarReport() {
    return (
        <ReportPage
            title="Registrar Report"
            subtitle="Purchases, sales, and returns in chronological order"
            endpoint="/reports/registrar"
            exportEndpoint="/reports/registrar/export"
            filters={filters}
            columns={columns}
            cards={cards}
            renderRow={renderRow}
            emptyText="No transactions match the selected filters."
        />
    );
}
