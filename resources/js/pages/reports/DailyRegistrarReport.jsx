import { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Badge, ErrorBanner, inputClass, PageHeader, secondaryButton, Table } from '../../components/ui';
import { money, number } from './ReportPage';

const today = () => new Date().toISOString().slice(0, 10);

export default function DailyRegistrarReport() {
    const { user, can } = useAuth();
    const isManager = user?.role === 'manager' || user?.roles?.includes('manager');
    const managerShopId = user?.shop_id ?? '';
    const [shopOptions, setShopOptions] = useState([]);
    const [filters, setFilters] = useState({ date: today(), shop_id: isManager ? managerShopId : '', search: '' });
    const [applied, setApplied] = useState({ date: today(), shop_id: isManager ? managerShopId : '', search: '' });
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!can('shops.view')) return;
        api('/shops').then((response) => {
            setShopOptions((response.data ?? []).map((shop) => ({ value: shop.id, label: `${shop.name} (${shop.code})` })));
        }).catch(() => setShopOptions([]));
    }, [can]);

    useEffect(() => {
        const timer = setTimeout(() => setApplied((current) => current.search === filters.search ? current : { ...current, search: filters.search }), 350);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const params = useMemo(() => {
        const values = { date: applied.date || today() };
        if (applied.shop_id) values.shop_id = applied.shop_id;
        if (applied.search) values.search = applied.search;
        return values;
    }, [applied]);

    const load = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api('/reports/daily-registrar', { params });
            const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
            setReport(payload);
        } catch (loadError) {
            setError(loadError.message);
            setReport(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [params.date, params.shop_id, params.search]);

    const downloadPdf = async () => {
        setIsDownloading(true);
        setError('');
        try {
            const blob = await api('/reports/daily-registrar/pdf', { params, responseType: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = blob.filename ?? `daily-registrar-report-${params.date}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (downloadError) {
            setError(downloadError.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const update = (key, value, applyNow = true) => {
        setFilters((current) => ({ ...current, [key]: value }));
        if (applyNow) setApplied((current) => ({ ...current, [key]: value }));
    };

    const clearFilters = () => {
        const next = { date: today(), shop_id: isManager ? managerShopId : '', search: '' };
        setFilters(next);
        setApplied(next);
    };

    const summary = report?.summary;
    const summaryCards = summary ? [
        { label: 'Approved Purchases', value: money(summary.purchase_total), isPositive: false },
        { label: 'Expenses', value: money(summary.expense_total), isPositive: false },
        { label: 'Sales', value: money(summary.sales_total), isPositive: true },
        { label: 'Net', value: money(summary.net_amount), isPositive: Number(summary.net_amount) > 0 },
    ] : [];

    return (
        <div className="space-y-4">
            <PageHeader title="Daily Report" subtitle={report ? `Daily Purchase, Expenses, and Sales · ${report.date}` : 'Daily Purchase, Expenses, and Sales'}>
                <button type="button" onClick={load} disabled={isLoading} className={secondaryButton}><FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button>
                <button type="button" onClick={downloadPdf} disabled={isDownloading} className={secondaryButton}><FiDownload className="h-4 w-4" /> {isDownloading ? 'Preparing…' : 'Download PDF'}</button>
            </PageHeader>

            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <label className="w-44">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date</span>
                    <input type="date" value={filters.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
                </label>
                <label className="w-52 min-w-[400px]">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Shop</span>
                    <select value={filters.shop_id} disabled={isManager} onChange={(e) => update('shop_id', e.target.value)} className={inputClass}>
                        <option value="">All shops</option>
                        {shopOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <label className="min-w-[100px] flex-1">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Search</span>
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="search" value={filters.search} onChange={(e) => update('search', e.target.value, false)} placeholder="Reference, party, category…" className={`${inputClass} pl-9`} />
                    </div>
                </label>
                {(filters.search || filters.shop_id || filters.date !== today()) && (
                    <button type="button" onClick={clearFilters} className={secondaryButton}><FiX className="h-4 w-4" /> Clear</button>
                )}
            </div>

            <ErrorBanner message={error} />

            {summaryCards.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {summaryCards.map(({ label, value, isPositive }) => (
                        <div key={label} className={`rounded-xl p-4 ring-1 ${isPositive ? 'bg-emerald-50 ring-emerald-200' : 'bg-red-50 ring-red-200'}`}>
                            <div className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{label}</div>
                            <div className={`mt-1 text-lg font-semibold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            <ReportSection title="Approved Purchases" count={summary?.purchase_count} total={summary?.purchase_total} columns={[{label:'Date'},{label:'Purchase No'},{label:'Supplier'},{label:'Shop'},{label:'Items'},{label:'Total'},{label:'Paid'},{label:'Status'}]} isLoading={isLoading} isEmpty={!report?.purchases?.length} emptyText="No approved purchases for selected date.">
                {(report?.purchases ?? []).map((row) => (
                    <tr key={row.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3">{row.date}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{row.reference_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.party_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.shop_name}</td>
                        <td className="px-4 py-3">{number(row.item_count)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(row.total)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(row.paid_amount)}</td>
                        <td className="px-4 py-3"><Badge tone={row.status === 'Approved' ? 'green' : 'amber'}>{row.status}</Badge></td>
                    </tr>
                ))}
            </ReportSection>

            <ReportSection title="Expenses" count={summary?.expense_count} total={summary?.expense_total} columns={[{label:'Date'},{label:'Category'},{label:'Reference'},{label:'Shop'},{label:'Note'},{label:'Amount'}]} isLoading={isLoading} isEmpty={!report?.expenses?.length} emptyText="No expenses for selected date.">
                {(report?.expenses ?? []).map((row) => (
                    <tr key={row.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.reference_no || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.shop_name}</td>
                        <td className="px-4 py-3 text-left">{row.note || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{money(row.amount)}</td>
                    </tr>
                ))}
            </ReportSection>

            <ReportSection title="Sales" count={summary?.sales_count} total={summary?.sales_total} columns={[{label:'Date'},{label:'Invoice No'},{label:'Customer'},{label:'Shop'},{label:'Items'},{label:'Total'},{label:'Paid'},{label:'Status'}]} isLoading={isLoading} isEmpty={!report?.sales?.length} emptyText="No sales for selected date.">
                {(report?.sales ?? []).map((row) => (
                    <tr key={row.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3">{row.date}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{row.reference_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.party_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.shop_name}</td>
                        <td className="px-4 py-3">{number(row.item_count)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(row.total)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(row.paid_amount)}</td>
                        <td className="px-4 py-3"><Badge tone={row.status === 'Returned' ? 'amber' : 'green'}>{row.status}</Badge></td>
                    </tr>
                ))}
            </ReportSection>
        </div>
    );
}

function ReportSection({ title, count, total, columns, isLoading, isEmpty, emptyText, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                <div className="text-xs text-slate-500">{number(count ?? 0)} records · Total {money(total ?? 0)}</div>
            </div>
            <Table columns={columns} isLoading={isLoading} isEmpty={isEmpty} emptyText={emptyText}>{children}</Table>
        </div>
    );
}
