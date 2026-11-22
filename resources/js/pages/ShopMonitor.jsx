import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { api } from '../api';
import { DetailPanels, OverviewPanels, SummaryCards } from '../components/ShopSummary';
import { ErrorBanner, inputClass, PageHeader, secondaryButton } from '../components/ui';

export default function ShopMonitor() {
    const [shops, setShops] = useState([]);
    const [shopId, setShopId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingShops, setIsLoadingShops] = useState(true);
    const [error, setError] = useState('');

    const loadShops = useCallback(async () => {
        setIsLoadingShops(true);
        setError('');
        try {
            const response = await api('/shops');
            const items = response.data ?? [];
            setShops(items);
            setShopId((current) => current || String(items.find((shop) => shop.is_active)?.id ?? items[0]?.id ?? ''));
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoadingShops(false);
        }
    }, []);

    const load = useCallback(async () => {
        if (!shopId) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await api('/shop-monitor', {
                params: {
                    shop_id: shopId,
                    date_from: dateFrom,
                    date_to: dateTo,
                },
            });
            setData(response.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [shopId, dateFrom, dateTo]);

    useEffect(() => {
        loadShops();
    }, [loadShops]);

    useEffect(() => {
        if (shopId) {
            load();
        }
    }, [shopId, load]);

    const clearDates = () => {
        setDateFrom('');
        setDateTo('');
    };

    if (isLoadingShops) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Loading shops…</div>;
    }

    if (!shops.length) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">No shops available to monitor.</div>;
    }

    if (!data && isLoading) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Loading shop summary…</div>;
    }

    if (!data) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Select a shop to view its summary.</div>;
    }

    const summary = data.summary ?? {};
    const productsByCategory = data.chart?.products_by_category ?? [];
    const purchaseStatuses = data.chart?.purchases_by_status ?? [];
    const statistics = data.statistics ?? {};
    const purchases = statistics.purchases ?? {};
    const periodLabel = dateFrom || dateTo ? `${dateFrom || 'Start'} – ${dateTo || 'End'}` : 'All dates';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Shop Monitor"
                subtitle={`${data.shop?.name ?? ''} · ${periodLabel}`}
            >
                <button type="button" onClick={load} disabled={isLoading} className={secondaryButton}>
                    <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </PageHeader>

            <ErrorBanner message={error} />

            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <label className="min-w-[220px] flex-1">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Shop</span>
                    <select value={shopId} onChange={(event) => setShopId(event.target.value)} className={inputClass}>
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                                {shop.name}{shop.code ? ` (${shop.code})` : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="w-40">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date from</span>
                    <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className={inputClass} />
                </label>
                <label className="w-40">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Date to</span>
                    <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className={inputClass} />
                </label>
                {dateFrom || dateTo ? (
                    <button type="button" onClick={clearDates} className={secondaryButton}>Clear dates</button>
                ) : null}
                <p className="w-full text-xs text-slate-400">The date range filters purchase and sales figures; inventory figures show current stock.</p>
            </div>

            <SummaryCards summary={summary} />
            <OverviewPanels
                productsByCategory={productsByCategory}
                purchaseStatuses={purchaseStatuses}
                summary={summary}
                catalogue={statistics.catalogue ?? {}}
                totalDue={purchases.total_due}
            />
            <DetailPanels
                productsByCategory={productsByCategory}
                lowStock={statistics.low_stock ?? []}
                recentPurchases={purchases.recent ?? []}
            />
        </div>
    );
}
