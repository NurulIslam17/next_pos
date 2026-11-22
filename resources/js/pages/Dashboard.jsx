import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { api } from '../api';
import { DetailPanels, OverviewPanels, SummaryCards } from '../components/ShopSummary';
import { ErrorBanner } from '../components/ui';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api('/dashboard');
            setData(response.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (!data && isLoading) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Loading dashboard…</div>;
    }

    const summary = data?.summary ?? {};
    const productsByCategory = data?.chart?.products_by_category ?? [];
    const purchaseStatuses = data?.chart?.purchases_by_status ?? [];
    const statistics = data?.statistics ?? {};
    const purchases = statistics.purchases ?? {};

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">Inventory, purchasing, and sales overview across your shop.</p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <ErrorBanner message={error} />

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
