import { FiAlertTriangle, FiBox, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiLayers, FiPackage, FiRotateCcw, FiShoppingBag, FiTag, FiTruck, FiTrendingUp } from 'react-icons/fi';

export const palette = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899'];
export const money = (value) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const number = (value) => Number(value ?? 0).toLocaleString();

function SummaryCard({ icon: Icon, label, value, hint, tone }) {
    return (
        <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
                </div>
                <span className={`rounded-lg p-2 ${tone}`}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

function BarChart({ items }) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const max = Math.max(...items.map((item) => item.count), 1);

    return (
        <div>
            <div className="flex h-56 items-end gap-3 overflow-x-auto pb-2">
                {items.length ? items.map((item, index) => {
                    const percent = total ? (item.count / total) * 100 : 0;

                    return (
                        <div key={item.name} className="flex h-full min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-xs font-medium tabular-nums text-slate-700">{number(item.count)}</span>
                            <div className="flex w-full flex-1 items-end">
                                <div
                                    className="w-full rounded-t-md"
                                    style={{ height: `${(item.count / max) * 100}%`, backgroundColor: palette[index % palette.length] }}
                                    title={`${item.name}: ${item.count} (${percent.toFixed(1)}%)`}
                                />
                            </div>
                            <span className="w-full truncate text-center text-xs text-slate-500" title={item.name}>{item.name}</span>
                        </div>
                    );
                }) : <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No products yet.</div>}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>{number(items.length)} categories</span>
                <span>{number(total)} products total</span>
            </div>
        </div>
    );
}

function StatusSplit({ items }) {
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={item.color}
                        style={{ width: `${total ? (item.count / total) * 100 : 0}%` }}
                    />
                ))}
            </div>
            <div className="mt-3 space-y-2 text-sm">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-600"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}</span>
                        <span className="tabular-nums text-slate-900">{number(item.count)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CatalogueCounts({ counts }) {
    const items = [
        { label: 'Categories', value: counts.categories, icon: FiTag },
        { label: 'Brands', value: counts.brands, icon: FiLayers },
        { label: 'Suppliers', value: counts.suppliers, icon: FiTruck },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {items.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3 text-center">
                    <Icon className="mx-auto h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-lg font-semibold text-slate-900">{number(value)}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            ))}
        </div>
    );
}

function LowStockList({ items }) {
    return (
        <div className="divide-y divide-slate-100">
            {items.length ? items.map((item) => {
                const max = Math.max(item.stock_alert, 1);
                const width = Math.min(100, (item.stock / max) * 100);

                return (
                    <div key={item.sku} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                                <p className="truncate text-xs text-slate-400">{item.sku}</p>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-red-600">{item.stock} / {item.stock_alert}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${width}%` }} />
                        </div>
                    </div>
                );
            }) : <p className="py-6 text-center text-sm text-slate-400">No low-stock products.</p>}
        </div>
    );
}

function RecentPurchases({ items }) {
    return (
        <div className="divide-y divide-slate-100">
            {items.length ? items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{item.purchase_no}</p>
                        <p className="truncate text-xs text-slate-400">{item.supplier_name} · {item.purchase_date}</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">{money(item.total)}</p>
                        <p className={`text-xs ${item.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.status === 'approved' ? 'Approved' : 'Pending'}
                        </p>
                    </div>
                </div>
            )) : <p className="py-6 text-center text-sm text-slate-400">No purchase orders yet.</p>}
        </div>
    );
}

function TopCategories({ items }) {
    const max = Math.max(...items.map((item) => item.count), 1);

    return (
        <div className="space-y-3">
            {items.length ? items.map((item, index) => (
                <div key={item.name}>
                    <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="tabular-nums text-slate-500">{number(item.count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: palette[index % palette.length] }} />
                    </div>
                </div>
            )) : <p className="py-6 text-center text-sm text-slate-400">No categories to show.</p>}
        </div>
    );
}

export function SummaryCards({ summary }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={FiPackage} label="Total products" value={number(summary.total_products)} hint="All catalogue items" tone="bg-indigo-50 text-indigo-600" />
            <SummaryCard icon={FiBox} label="In stock" value={number(summary.in_stock_products)} hint={`${number(summary.out_of_stock_products)} out of stock`} tone="bg-emerald-50 text-emerald-600" />
            <SummaryCard icon={FiLayers} label="Total items in stock" value={number(summary.total_items_in_stock)} hint="Units available" tone="bg-teal-50 text-teal-600" />
            <SummaryCard icon={FiDollarSign} label="Stock value" value={money(summary.total_stock_value)} hint="Based on cost price" tone="bg-emerald-50 text-emerald-600" />
            <SummaryCard icon={FiAlertTriangle} label="Low stock" value={number(summary.low_stock_products)} hint="At or below alert level" tone="bg-red-50 text-red-600" />
            <SummaryCard icon={FiCheckCircle} label="Active products" value={number(summary.active_products)} hint={`${number(summary.inactive_products)} inactive`} tone="bg-sky-50 text-sky-600" />
            <SummaryCard icon={FiShoppingBag} label="Total purchases" value={number(summary.total_purchases)} hint="All purchase orders" tone="bg-violet-50 text-violet-600" />
            <SummaryCard icon={FiClock} label="Pending approval" value={number(summary.pending_purchases)} hint="Awaiting approval" tone="bg-amber-50 text-amber-600" />
            <SummaryCard icon={FiCheckCircle} label="Approved purchases" value={number(summary.approved_purchases)} hint="Stock already received" tone="bg-emerald-50 text-emerald-600" />
            <SummaryCard icon={FiCreditCard} label="Purchase amount" value={money(summary.total_purchase_amount)} hint="All purchase orders" tone="bg-indigo-50 text-indigo-600" />
            <SummaryCard icon={FiTrendingUp} label="Sales amount" value={money(summary.total_sales_amount)} hint={`${number(summary.total_sales)} completed sales`} tone="bg-emerald-50 text-emerald-600" />
            <SummaryCard icon={FiRotateCcw} label="Returned Sale Amount" value={money(summary.returned_sales_amount)} hint={`${number(summary.total_returned_sales)} returned sales`} tone="bg-rose-50 text-rose-600" />
        </section>
    );
}

export function OverviewPanels({ productsByCategory, purchaseStatuses, summary, catalogue, totalDue }) {
    return (
        <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200 xl:col-span-2">
                <h2 className="font-semibold text-slate-900">Products by category</h2>
                <p className="mb-5 mt-1 text-xs text-slate-500">Product counts across categories.</p>
                <BarChart items={productsByCategory} />
            </div>
            <div className="space-y-5 rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div>
                    <h2 className="font-semibold text-slate-900">Catalogue</h2>
                    <p className="mb-4 mt-1 text-xs text-slate-500">Master data counts.</p>
                    <CatalogueCounts counts={catalogue} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                    <h2 className="mb-3 font-semibold text-slate-900">Product status</h2>
                    <StatusSplit items={[
                        { label: 'Active', count: summary.active_products ?? 0, color: 'bg-emerald-500' },
                        { label: 'Inactive', count: summary.inactive_products ?? 0, color: 'bg-slate-300' },
                    ]} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-slate-900">Purchase status</h2>
                        <span className="text-xs text-slate-500">Due {money(totalDue)}</span>
                    </div>
                    <StatusSplit items={purchaseStatuses.map((item, index) => ({
                        label: item.name,
                        count: item.count,
                        color: index === 0 ? 'bg-amber-500' : 'bg-emerald-500',
                    }))} />
                </div>
            </div>
        </section>
    );
}

export function DetailPanels({ productsByCategory, lowStock, recentPurchases }) {
    return (
        <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-2">
                    <FiBox className="h-4 w-4 text-red-500" />
                    <h2 className="font-semibold text-slate-900">Low-stock items</h2>
                </div>
                <LowStockList items={lowStock} />
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-2">
                    <FiShoppingBag className="h-4 w-4 text-indigo-500" />
                    <h2 className="font-semibold text-slate-900">Recent purchases</h2>
                </div>
                <RecentPurchases items={recentPurchases} />
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="mb-4 font-semibold text-slate-900">Top categories</h2>
                <TopCategories items={productsByCategory.slice(0, 5)} />
            </div>
        </section>
    );
}
