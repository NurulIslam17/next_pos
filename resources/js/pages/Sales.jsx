import { useEffect, useState } from 'react';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiEye, FiPlus, FiPrinter, FiRotateCcw, FiSearch, FiX } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth';
import Modal from '../components/Modal';
import SaleForm from '../components/SaleForm';
import { Badge, ErrorBanner, inputClass, PageHeader, primaryButton, secondaryButton, Table, useList } from '../components/ui';

const money = (value) => Number(value ?? 0).toFixed(2);

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
})[char]);

function writePosInvoice(printWindow, sale, downloadCallback, printedBy = '') {
    const itemRows = (sale.items ?? []).map((item) => {
        const discount = Number(item.discount ?? 0);
        const vatRate = Number(item.vat_rate ?? 0);
        const vatType = item.vat_type ?? 'included';
        const qty = Number(item.quantity ?? 0);
        const price = Number(item.unit_price ?? 0);
        return `
        <div class="item">
            <div class="item-name">${escapeHtml(item.product_name ?? '-')}${item.product_sku ? ` (${escapeHtml(item.product_sku)})` : ''}</div>
            <div class="row item-detail">
                <span>${qty} x ${money(price)}  ${vatRate > 0 ? `${vatRate}%(${escapeHtml(vatType)})` : ''} ${discount > 0 ? `Disc: ${money(discount)}` : ''}</span>
                <span>${money(item.line_total)}</span>
            </div>
        </div>
    `;
    }).join('');

    printWindow.document.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${escapeHtml(sale.sale_no)}</title>
    <style>
        @page { size: 80mm auto; margin: 0; }
        * { box-sizing: border-box; }
        body { width: 80mm; margin: 0 auto; padding: 4mm; background: #fff; color: #111; font-family: "Courier New", monospace; font-size: 10px; line-height: 1.35; }
        .toolbar { display: flex; gap: 8px; justify-content: center; padding: 8px; margin: -4mm -4mm 4mm; background: #f3f4f6; }
        button { cursor: pointer; border: 1px solid #94a3b8; border-radius: 4px; background: #fff; padding: 5px 10px; font: inherit; font-weight: bold; }
        button.primary { border-color: #1d4ed8; background: #1d4ed8; color: #fff; }
        .center { text-align: center; }
        .right { text-align: right; }
        .title { margin: 0; font-size: 13px; text-align: center; letter-spacing: 1px; }
        .shop { margin: 2px 0 8px; font-weight: bold; text-align: center; }
        .rule { margin: 6px 0; border-top: 1px dashed #111; }
        .row { display: flex; justify-content: space-between; gap: 8px; }
        .item { margin: 6px 0; }
        .item-name { font-weight: bold; }
        .item-detail { color: #374151; font-size: 9px; }
        .totals { margin-top: 6px; }
        .total { font-weight: bold; }
        .grand { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #111; font-size: 11px; font-weight: bold; }
        .footer { margin-top: 10px; text-align: center; }
        .status { font-weight: bold; }
        @media print {
            .toolbar { display: none !important; }
            body { width: 80mm; padding: 3mm; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button type="button" class="primary" onclick="window.print()">Print</button>
        <button type="button" onclick="window.opener.${downloadCallback}()">Download PDF</button>
    </div>
    <div class="invoice">
        <h1 class="title">SALES INVOICE</h1>
        <div class="shop">${escapeHtml(sale.shop_name ?? '-')}</div>
        <div class="rule"></div>
        <div class="row"><span>Invoice</span><span>${escapeHtml(sale.sale_no)}</span></div>
        <div class="row"><span>Date</span><span>${escapeHtml(sale.sale_date)}</span></div>
        <div class="row"><span>Customer</span><span>${escapeHtml(sale.customer_name ?? 'Walk-in Customer')}</span></div>
        <div class="row"><span>Sold By</span><span>${escapeHtml(sale.created_by_name ?? '-')}</span></div>
        <div class="row"><span>Payment</span><span>${escapeHtml(sale.payment_type_name ?? '-')}</span></div>
        ${sale.reference_no ? `<div class="row"><span>Reference</span><span>${escapeHtml(sale.reference_no)}</span></div>` : ''}
        <div class="rule"></div>
        ${itemRows || '<div class="center">No items recorded.</div>'}
        <div class="rule"></div>
        <div class="totals">
            <div class="row"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div>
            <div class="row"><span>Discount</span><span>-${money(sale.discount)}</span></div>
            <div class="row"><span>VAT</span><span>${money(sale.vat)}</span></div>
            <div class="row grand"><span>Total</span><span>${money(sale.total)}</span></div>
            <div class="row"><span>Paid</span><span>${money(sale.paid_amount)}</span></div>
            <div class="row total"><span>Due</span><span>${money(sale.due_amount)}</span></div>
        </div>
        ${sale.status === 'returned' ? `
            <div class="rule"></div>
            <div class="row status"><span>Status</span><span>RETURNED</span></div>
            <div class="row"><span>Refund</span><span>${money(sale.refund_amount)}</span></div>
        ` : ''}
        ${sale.note ? `<div class="rule"></div><div>Note: ${escapeHtml(sale.note)}</div>` : ''}
        <div class="rule"></div>
        ${printedBy ? `<div class="row"><span>Printed By</span><span>${escapeHtml(printedBy)}</span></div>` : ''}
        <div class="footer">Thank you for your purchase.</div>
    </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
}

const StatusBadge = ({ status }) => (
    <Badge tone={status === 'returned' ? 'amber' : 'green'}>
        {status === 'returned' ? 'Returned' : 'Completed'}
    </Badge>
);

export default function Sales() {
    const { can, isSuperAdmin, user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [details, setDetails] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [isReturning, setIsReturning] = useState(false);
    const [downloadingSaleId, setDownloadingSaleId] = useState(null);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const { items, meta, isLoading, error, reload, setError } = useList('/sales', {
        search: query || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 10,
    });

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const clearFilters = () => {
        setSearch('');
        setQuery('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const currentPage = meta?.current_page ?? 1;
    const perPage = meta?.per_page ?? 10;

    const openDetails = async (id) => {
        try {
            const response = await api(`/sales/${id}`);
            setDetails(response.data);
            setReturnReason('');
        } catch (e) {
            setError(e.message);
        }
    };

    const returnSale = async (sale) => {
        if (!window.confirm(`Return sale ${sale.sale_no} and restore stock?`)) {
            return;
        }

        setIsReturning(true);
        try {
            const response = await api(`/sales/${sale.id}/return`, {
                method: 'POST',
                body: { return_reason: returnReason || null },
            });
            setDetails(response.data);
            setReturnReason('');
            reload();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsReturning(false);
        }
    };

    const downloadInvoice = async (sale) => {
        setDownloadingSaleId(sale.id);
        try {
            const blob = await api(`/sales/${sale.id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sale-${sale.sale_no}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setError(e.message);
        } finally {
            setDownloadingSaleId(null);
        }
    };

    const printInvoice = (sale) => {
        const printWindow = window.open('', '_blank', 'width=420,height=760');
        if (!printWindow) {
            setError('Allow pop-ups to open the printable invoice.');
            return;
        }

        const callbackName = `downloadSaleInvoice${sale.id}`;
        window[callbackName] = () => downloadInvoice(sale);
        printWindow.onbeforeunload = () => {
            delete window[callbackName];
        };
        writePosInvoice(printWindow, sale, callbackName, user?.name ?? '');
    };

    if (isCreating) {
        return (
            <div className="space-y-4">
                <PageHeader title="New Sale" subtitle="Create a sale and reduce stock immediately">
                    <button onClick={() => setIsCreating(false)} className={secondaryButton}>
                        <FiArrowLeft className="h-4 w-4" /> Back
                    </button>
                </PageHeader>
                <SaleForm
                    onSaved={() => { setIsCreating(false); reload(); }}
                    onCancel={() => setIsCreating(false)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Sales" subtitle={meta ? `${meta.total} sales` : 'Sales and returns'}>
                {can('sales.create') && !isSuperAdmin && (
                    <button onClick={() => setIsCreating(true)} className={primaryButton}>
                        <FiPlus className="h-4 w-4" /> Add Sale
                    </button>
                )}
            </PageHeader>

            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <label className="min-w-[240px] flex-1">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Search</span>
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Invoice No, Reference No, Customer…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </label>
                <label className="w-44">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date from</span>
                    <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </label>
                <label className="w-44">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date to</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </label>
                {search || query || dateFrom || dateTo ? (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        <FiX className="h-4 w-4" /> Clear
                    </button>
                ) : null}
            </div>

            <ErrorBanner message={error} />
            <Table
                columns={[
                    { label: 'SL' },
                    { label: 'Invoice No' },
                    { label: 'Date' },
                    { label: 'Customer' },
                    { label: 'Shop' },
                    { label: 'Items' },
                    { label: 'Total' },
                    { label: 'Due' },
                    { label: 'Status' },
                    { label: 'Action' },
                ]}
                isLoading={isLoading}
                isEmpty={items.length === 0}
                emptyText="No sales yet."
            >
                {items.map((sale, index) => (
                    <tr key={sale.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{(currentPage - 1) * perPage + index + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                            <button onClick={() => openDetails(sale.id)} className="font-medium hover:text-indigo-600">
                                {sale.sale_no}
                            </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{sale.sale_date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{sale.customer_name ?? 'Walk-in Customer'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{sale.shop_name ?? '-'}</td>
                        <td className="px-4 py-3">{sale.items?.length ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(sale.total)}</td>
                        <td className="px-4 py-3">
                            <Badge tone={Number(sale.due_amount) > 0 ? 'amber' : 'green'}>{money(sale.due_amount)}</Badge>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={sale.status} /></td>
                        <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => openDetails(sale.id)} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                    <FiEye className="h-3.5 w-3.5" /> Details
                                </button>
                                <button onClick={() => printInvoice(sale)} className="inline-flex h-8 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                                    <FiPrinter className="h-3.5 w-3.5" /> Print
                                </button>
                                {can('sales.return') && sale.status === 'completed' && (
                                    <button onClick={() => returnSale(sale)} className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-200 bg-white px-2.5 text-xs font-medium text-amber-700 hover:bg-amber-50">
                                        <FiRotateCcw className="h-3.5 w-3.5" /> Return
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        Page {meta.current_page} of {meta.last_page} · {meta.total} sales
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={meta.current_page <= 1}
                            onClick={() => setPage((current) => current - 1)}
                            className={secondaryButton}
                        >
                            <FiChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => setPage((current) => current + 1)}
                            className={secondaryButton}
                        >
                            Next <FiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {details && (
                <Modal title={`Sale ${details.sale_no}`} onClose={() => setDetails(null)}>
                    <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div><span className="text-slate-500">Date</span><div className="font-medium">{details.sale_date}</div></div>
                        <div><span className="text-slate-500">Customer</span><div className="font-medium">{details.customer_name ?? 'Walk-in Customer'}</div></div>
                        <div><span className="text-slate-500">Shop</span><div className="font-medium">{details.shop_name ?? '-'}</div></div>
                        <div><span className="text-slate-500">Sold By</span><div className="font-medium">{details.created_by_name ?? '-'}</div></div>
                        <div><span className="text-slate-500">Payment</span><div className="font-medium">{details.payment_type_name ?? '-'}</div></div>
                        <div><span className="text-slate-500">Reference</span><div className="font-medium">{details.reference_no ?? '-'}</div></div>
                        <div><span className="text-slate-500">Status</span><div className="mt-1"><StatusBadge status={details.status} /></div></div>
                    </div>

                    {details.status === 'returned' && (
                        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Returned on {details.returned_at ?? '-'} · Refund {money(details.refund_amount)}
                            {details.return_reason ? ` · ${details.return_reason}` : ''}
                        </p>
                    )}

                    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
                        <table className="min-w-[640px] w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2">Product</th>
                                    <th className="px-3 py-2">Qty</th>
                                    <th className="px-3 py-2">Unit Price</th>
                                    <th className="px-3 py-2">VAT</th>
                                    <th className="px-3 py-2">Discount</th>
                                    <th className="px-3 py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {details.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{item.product_name}</div>
                                            <div className="text-xs text-slate-500">{item.product_sku}</div>
                                        </td>
                                        <td className="px-3 py-2">{item.quantity}</td>
                                        <td className="px-3 py-2">{money(item.unit_price)}</td>
                                        <td className="px-3 py-2">{money(item.vat_rate)}%</td>
                                        <td className="px-3 py-2">{money(item.discount)}</td>
                                        <td className="px-3 py-2">{money(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col items-end gap-1 text-sm">
                        <div className="w-64 flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(details.subtotal)}</span></div>
                        <div className="w-64 flex justify-between"><span className="text-slate-500">Discount</span><span>-{money(details.discount)}</span></div>
                        <div className="w-64 flex justify-between"><span className="text-slate-500">VAT</span><span>{money(details.vat)}</span></div>
                        <div className="w-64 flex justify-between font-semibold"><span>Grand Total</span><span>{money(details.total)}</span></div>
                        <div className="w-64 flex justify-between text-emerald-700"><span>Paid</span><span>{money(details.paid_amount)}</span></div>
                        <div className="w-64 flex justify-between text-amber-700"><span>Due</span><span>{money(details.due_amount)}</span></div>
                    </div>

                    {can('sales.return') && details.status === 'completed' && (
                        <div className="mt-5 space-y-3 border-t pt-4">
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium text-slate-600">Return reason (optional)</span>
                                <textarea
                                    rows="2"
                                    value={returnReason}
                                    onChange={(event) => setReturnReason(event.target.value)}
                                    className={inputClass}
                                    placeholder="Reason for return"
                                />
                            </label>
                            <div className="flex justify-end">
                                <button onClick={() => returnSale(details)} disabled={isReturning} className={primaryButton}>
                                    <FiRotateCcw className="h-4 w-4" /> {isReturning ? 'Returning…' : 'Return Sale & Restore Stock'}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
