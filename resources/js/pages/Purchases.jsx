import { useEffect, useState } from 'react';
import { FiArrowLeft, FiCheck, FiEye, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth';
import Modal from '../components/Modal';
import PurchaseForm from '../components/PurchaseForm';
import { Badge, ErrorBanner, PageHeader, primaryButton, secondaryButton, Table, useList } from '../components/ui';

const money = (value) => Number(value ?? 0).toFixed(2);

const StatusBadge = ({ status }) => (
    <Badge tone={status === 'approved' ? 'green' : 'amber'}>{status === 'approved' ? 'Approved' : 'Pending'}</Badge>
);

export default function Purchases() {
    const { can } = useAuth();
    const canApprove = can('purchases.approve');
    const [isCreating, setIsCreating] = useState(false);
    const [details, setDetails] = useState(null);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const { items, meta, isLoading, error, reload, setError } = useList('/purchases', {
        search: query || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 15,
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
    };

    const openDetails = async (id) => {
        try {
            const response = await api(`/purchases/${id}`);
            setDetails(response.data);
        } catch (e) {
            setError(e.message);
        }
    };

    const approve = async (id) => {
        try {
            await api(`/purchases/${id}/approve`, { method: 'POST' });
            setDetails(null);
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    if (isCreating) {
        return (
            <div className="space-y-4">
                <PageHeader title="New Purchase" subtitle="Create a purchase order for Super Admin approval">
                    <button onClick={() => setIsCreating(false)} className={secondaryButton}><FiArrowLeft className="h-4 w-4" /> Back</button>
                </PageHeader>
                <PurchaseForm onSaved={() => { setIsCreating(false); reload(); }} onCancel={() => setIsCreating(false)} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Purchases" subtitle={meta ? `${meta.total} purchase orders` : 'Purchase orders awaiting approval'}>
                {can('purchases.create') && (
                    <button onClick={() => setIsCreating(true)} className={primaryButton}>
                        <FiPlus className="h-4 w-4" /> Add Purchase
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
                            placeholder="Purchase No, Reference No, Supplier…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </label>
                <label className="w-44">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date to</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
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
                    { label: 'Purchase No' },
                    { label: 'Reference No' },
                    { label: 'Date' },
                    { label: 'Supplier' },
                    { label: 'Shop' },
                    { label: 'Items' },
                    { label: 'Total' },
                    { label: 'Due' },
                    { label: 'Status' },
                    { label: 'Action' },
                ]}
                isLoading={isLoading}
                isEmpty={items.length === 0}
                emptyText="No purchase orders yet."
            >
                {items.map((purchase,index) => (
                    <tr key={purchase.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{index + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3">{purchase.purchase_no}</td>
                        <td className="whitespace-nowrap px-4 py-3">{purchase.reference_no ?? '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{purchase.purchase_date}</td>
                        <td className="px-4 py-3">{purchase.supplier_name ?? '-'}</td>
                        <td className="px-4 py-3">{purchase.shop_name ?? '-'}</td>
                        <td className="px-4 py-3">{purchase.items?.length ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(purchase.total)}</td>
                        <td className="px-4 py-3">
                            <Badge tone={Number(purchase.due_amount) > 0 ? 'amber' : 'green'}>{money(purchase.due_amount)}</Badge>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={purchase.status} /></td>
                        <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => openDetails(purchase.id)} className="inline-flex h-8 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                                    <FiEye className="h-3.5 w-3.5" /> View
                                </button>
                                {canApprove && purchase.status === 'pending' && (
                                    <button onClick={() => approve(purchase.id)} className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                                        <FiCheck className="h-3.5 w-3.5" /> Approve
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {details && (
                <Modal title={`Purchase ${details.purchase_no}`} onClose={() => setDetails(null)} wide>
                    <div className="mb-4 grid gap-3 text-sm sm:grid-cols-4">
                        <div><span className="text-slate-500">Date</span><div className="font-medium">{details.purchase_date}</div></div>
                        <div><span className="text-slate-500">Supplier</span><div className="font-medium">{details.supplier_name ?? '-'}</div></div>
                        <div><span className="text-slate-500">Payment</span><div className="font-medium">{details.payment_type_name ?? '-'}</div></div>
                        <div><span className="text-slate-500">Status</span><div className="mt-1"><StatusBadge status={details.status} /></div></div>
                    </div>
                    {details.status === 'approved' && (
                        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            Approved by {details.approved_by_name ?? 'Super Admin'} on {details.approved_at ?? '-'}.
                        </p>
                    )}
                    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
                        <table className="min-w-[640px] w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit Cost</th><th className="px-3 py-2">VAT</th><th className="px-3 py-2">Discount</th><th className="px-3 py-2">Total</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {details.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2"><div className="font-medium">{item.product_name}</div><div className="text-xs text-slate-500">{item.product_sku}</div></td>
                                        <td className="px-3 py-2">{item.quantity}</td>
                                        <td className="px-3 py-2">{money(item.unit_cost)}</td>
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
                    {canApprove && details.status === 'pending' && (
                        <div className="mt-5 flex justify-end">
                            <button onClick={() => approve(details.id)} className={primaryButton}>
                                <FiCheck className="h-4 w-4" /> Approve & Update Stock
                            </button>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
