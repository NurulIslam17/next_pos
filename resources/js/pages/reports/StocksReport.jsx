import { Badge } from '../../components/ui';
import ReportPage, { money, number } from './ReportPage';

const filters = [
    { key: 'shop_id', label: 'Shop', type: 'select' ,className: 'min-w-[180px] flex-1'},
    { key: 'search', label: 'Search', type: 'search', placeholder: 'SKU or product name…', className: 'min-w-[240px] flex-1' },
    {
        key: 'stock_status',
        label: 'Stock status',
        type: 'select',
        options: [
            { value: 'in', label: 'In stock' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
        ],
    },
];

const columns = [
    { label: 'SL' },
    { label: 'Product' },
    { label: 'SKU' },
    { label: 'Category' },
    { label: 'Shop' },
    { label: 'Cost' },
    { label: 'Price' },
    { label: 'Stock' },
    { label: 'Alert' },
    { label: 'Stock Value' },
    { label: 'Status' },
];

const cards = [
    { key: 'total_products', label: 'Products' },
    { key: 'in_stock_products', label: 'In Stock' },
    { key: 'low_stock_products', label: 'Low Stock' },
    { key: 'out_of_stock_products', label: 'Out of Stock' },
    { key: 'total_stock_value', label: 'Stock Value', format: 'money' },
];

const statusTone = { in: 'green', low: 'amber', out: 'slate' };

const renderRow = (product, index, currentPage, perPage) => (
    <tr key={product.id} className="text-center">
        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
        <td className="px-4 py-3 text-left">{product.name}</td>
        <td className="whitespace-nowrap px-4 py-3">{product.sku}</td>
        <td className="px-4 py-3">{product.category_name ?? '-'}</td>
        <td className="px-4 py-3">{product.shop_name ?? '-'}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(product.cost_price)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(product.price)}</td>
        <td className="whitespace-nowrap px-4 py-3">{number(product.stock)}</td>
        <td className="whitespace-nowrap px-4 py-3">{number(product.stock_alert)}</td>
        <td className="whitespace-nowrap px-4 py-3">{money(product.stock_value)}</td>
        <td className="px-4 py-3">
            <Badge tone={statusTone[product.stock_status] ?? 'slate'}>
                {product.stock_status === 'in' ? 'In' : product.stock_status === 'low' ? 'Low' : 'Out'}
            </Badge>
        </td>
    </tr>
);

export default function StocksReport() {
    return (
        <ReportPage
            title="Stocks Report"
            subtitle="Current inventory valuation and stock health"
            endpoint="/reports/stocks"
            exportEndpoint="/reports/stocks/export"
            filters={filters}
            columns={columns}
            cards={cards}
            renderRow={renderRow}
            emptyText="No products match the selected filters."
        />
    );
}
