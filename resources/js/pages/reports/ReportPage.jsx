import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiDownload, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { ErrorBanner, inputClass, PageHeader, secondaryButton, Table, useList } from '../../components/ui';

export const money = (value) => Number(value ?? 0).toFixed(2);
export const number = (value) => Number(value ?? 0).toLocaleString();

const initialValues = (filters, managerShopId) =>
    Object.fromEntries(
        filters.map((filter) => [
            filter.key,
            filter.key === 'shop_id' && managerShopId ? managerShopId : filter.default ?? '',
        ])
    );

export default function ReportPage({ title, subtitle, endpoint, exportEndpoint, filters, columns, cards, renderRow, emptyText }) {
    const { user, can } = useAuth();
    const isManager = user?.role === 'manager' || user?.roles?.includes('manager');
    const managerShopId = user?.shop_id ?? '';
    const hasShopFilter = filters.some((filter) => filter.key === 'shop_id');

    const initial = useMemo(() => initialValues(filters, isManager ? managerShopId : ''), [filters, isManager, managerShopId]);
    const [draft, setDraft] = useState(initial);
    const [applied, setApplied] = useState(initial);
    const [page, setPage] = useState(1);
    const [shopOptions, setShopOptions] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    const resolvedFilters = useMemo(
        () =>
            filters.map((filter) =>
                filter.key === 'shop_id'
                    ? { ...filter, options: shopOptions, disabled: isManager, allLabel: 'All shops' }
                    : filter
            ),
        [filters, isManager, shopOptions]
    );

    useEffect(() => {
        if (!hasShopFilter || !can('shops.view')) {
            return;
        }

        api('/shops')
            .then((response) => {
                setShopOptions(
                    (response.data ?? []).map((shop) => ({
                        value: shop.id,
                        label: `${shop.name} (${shop.code})`,
                    }))
                );
            })
            .catch(() => setShopOptions([]));
    }, [can, hasShopFilter]);

    const params = useMemo(() => {
        const values = {};
        Object.entries(applied).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                values[key] = value;
            }
        });
        values.page = page;
        values.per_page = 10;

        return values;
    }, [applied, page]);

    const { items, meta, summary, isLoading, error, reload } = useList(endpoint, params);

    useEffect(() => {
        setDraft(initial);
        setApplied(initial);
        setPage(1);
    }, [initial]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const textValues = {};
            resolvedFilters.filter((filter) => filter.type === 'search').forEach((filter) => {
                textValues[filter.key] = draft[filter.key] ?? '';
            });

            setApplied((current) => {
                const unchanged = Object.entries(textValues).every(([key, value]) => current[key] === value);

                return unchanged ? current : { ...current, ...textValues };
            });
            setPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [draft, resolvedFilters]);

    const updateFilter = (filter, value) => {
        setDraft((current) => ({ ...current, [filter.key]: value }));

        if (filter.type !== 'search') {
            setApplied((current) => ({ ...current, [filter.key]: value }));
            setPage(1);
        }
    };

    const clearFilters = () => {
        setDraft(initial);
        setApplied(initial);
        setPage(1);
    };

    const exportReport = async () => {
        setIsExporting(true);
        setExportError('');

        try {
            const blob = await api(exportEndpoint, { params: applied, responseType: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report';
            link.href = url;
            link.download = `${slug}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (exportFailure) {
            setExportError(exportFailure.message);
        } finally {
            setIsExporting(false);
        }
    };

    const currentPage = meta?.current_page ?? 1;
    const perPage = meta?.per_page ?? 10;
    const hasFilters = Object.values(draft).some((value) => value !== '' && value !== null);

    return (
        <div className="space-y-4">
            <PageHeader title={title} subtitle={meta ? `${subtitle} · ${number(meta.total)} records` : subtitle}>
                <button type="button" onClick={reload} disabled={isLoading} className={secondaryButton}>
                    <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                {exportEndpoint && (
                    <button type="button" onClick={exportReport} disabled={isExporting} className={secondaryButton}>
                        <FiDownload className="h-4 w-4" /> {isExporting ? 'Preparing…' : 'Export CSV'}
                    </button>
                )}
            </PageHeader>

            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                {resolvedFilters.map((filter) => {
                    const common = {
                        value: draft[filter.key] ?? '',
                        onChange: (event) => updateFilter(filter, event.target.value),
                        disabled: filter.disabled,
                        className: `${inputClass} ${filter.type === 'search' ? 'pl-9' : ''}`,
                    };

                    return (
                        <label key={filter.key} className={filter.className ?? 'w-44'}>
                            <span className="mb-1 block text-xs font-medium text-slate-500">{filter.label}</span>
                            {filter.type === 'select' ? (
                                <select {...common}>
                                    <option value="">{filter.allLabel ?? 'All'}</option>
                                    {filter.options.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : filter.type === 'search' ? (
                                <div className="relative">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input type="search" placeholder={filter.placeholder} {...common} />
                                </div>
                            ) : (
                                <input type={filter.type} {...common} />
                            )}
                        </label>
                    );
                })}
                {hasFilters && (
                    <button type="button" onClick={clearFilters} className={secondaryButton}>
                        <FiX className="h-4 w-4" /> Clear
                    </button>
                )}
            </div>

            <ErrorBanner message={error ?? exportError} />

            {summary && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => (
                        <div key={card.key} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">{card.label}</div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                                {card.format === 'money' ? money(summary[card.key]) : number(summary[card.key])}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Table columns={columns} isLoading={isLoading} isEmpty={items.length === 0} emptyText={emptyText}>
                {items.map((row, index) => renderRow(row, index, currentPage, perPage))}
            </Table>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        Page {meta.current_page} of {meta.last_page} · {number(meta.total)} records
                    </span>
                    <div className="flex gap-2">
                        <button disabled={meta.current_page <= 1} onClick={() => setPage((current) => current - 1)} className={secondaryButton}>
                            <FiChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage((current) => current + 1)} className={secondaryButton}>
                            Next <FiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
