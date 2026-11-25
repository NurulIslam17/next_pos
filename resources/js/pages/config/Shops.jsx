import { useMemo, useState } from "react";
import {
    FiCheckCircle,
    FiHome,
    FiMapPin,
    FiPauseCircle,
    FiPhone,
    FiPlus,
    FiSearch,
    FiUsers,
    FiX,
} from "react-icons/fi";
import { api } from "../../api";
import { useAuth } from "../../auth";
import Modal from "../../components/Modal";
import {
    Badge,
    ErrorBanner,
    Field,
    FormActions,
    inputClass,
    PageHeader,
    primaryButton,
    RowActions,
    Table,
    useList,
    useSubmit,
} from "../../components/ui";

function SummaryCard({ icon: Icon, label, value, hint, tone }) {
    return (
        <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{hint}</p>
                </div>
                <span className={`rounded-lg p-2 ${tone}`}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

function ShopForm({ shop, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: shop?.name ?? "",
        code: shop?.code ?? "",
        address: shop?.address ?? "",
        phone: shop?.phone ?? "",
        is_active: shop?.is_active ?? true,
    });
    const { first, message, isSaving, submit } = useSubmit();
    const set = (key) => (e) =>
        setForm({
            ...form,
            [key]:
                e.target.type === "checkbox"
                    ? e.target.checked
                    : e.target.value,
        });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() =>
            api(shop ? `/shops/${shop.id}` : "/shops", {
                method: shop ? "PUT" : "POST",
                body: form,
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={message} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Shop name" error={first("name")}>
                    <input
                        className={inputClass}
                        value={form.name}
                        onChange={set("name")}
                        placeholder="e.g. Main Branch"
                        required
                    />
                </Field>
                <Field label="Shop code" error={first("code")}>
                    <input
                        className={inputClass}
                        value={form.code}
                        onChange={set("code")}
                        placeholder="DHK"
                        maxLength={3}
                        required
                    />
                    <span
                        className={`mt-1 block text-xs font-normal ${form.code.length >= 3 ? "text-amber-600" : "text-slate-400"}`}
                    >
                        {form.code.length >= 3
                            ? "Maximum 3 characters reached."
                            : `Maximum 3 characters (${form.code.length}/3). Uppercase preferred.`}
                    </span>
                </Field>
            </div>
            <Field label="Address" error={first("address")}>
                <input
                    className={inputClass}
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Street, city"
                />
            </Field>
            <Field label="Phone" error={first("phone")}>
                <input
                    className={inputClass}
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="Contact number"
                />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={set("is_active")}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                    <span className="block text-sm font-medium text-slate-800">
                        Active shop
                    </span>
                    <span className="block text-xs text-slate-500">
                        Enable this shop for daily operations.
                    </span>
                </span>
            </label>
            <div className="border-t border-slate-200 pt-4">
                <FormActions isSaving={isSaving} onCancel={onCancel} />
            </div>
        </form>
    );
}

export default function Shops() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList("/shops");
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const activeCount = items.filter((shop) => shop.is_active).length;
    const staffCount = items.reduce(
        (total, shop) => total + Number(shop.users_count ?? 0),
        0,
    );
    const hasFilters = search !== "" || status !== "";

    const filteredItems = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return items.filter((shop) => {
            const matchesStatus =
                status === "" || (status === "active") === shop.is_active;
            const matchesSearch =
                needle === "" ||
                [shop.name, shop.code, shop.address, shop.phone].some((value) =>
                    value?.toLowerCase().includes(needle),
                );

            return matchesStatus && matchesSearch;
        });
    }, [items, search, status]);

    const clearFilters = () => {
        setSearch("");
        setStatus("");
    };

    const handleDelete = async (shop) => {
        if (!window.confirm(`Delete ${shop.name}? This cannot be undone.`)) {
            return;
        }
        try {
            await api(`/shops/${shop.id}`, { method: "DELETE" });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("shops.update") || can("shops.delete");
    const columns = [
        { label: "SL" },
        { label: "Shop" },
        { label: "Contact" },
        { label: "Staff" },
        { label: "Status" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-5">
            <PageHeader
                title="Shops"
                subtitle={`${activeCount} active of ${items.length} shops`}
            >
                {can("shops.create") && (
                    <button
                        onClick={() => setEditing({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add shop
                    </button>
                )}
            </PageHeader>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={FiHome}
                    label="Total shops"
                    value={items.length}
                    hint="Registered locations"
                    tone="bg-indigo-50 text-indigo-600"
                />
                <SummaryCard
                    icon={FiCheckCircle}
                    label="Active shops"
                    value={activeCount}
                    hint="Available for operations"
                    tone="bg-emerald-50 text-emerald-600"
                />
                <SummaryCard
                    icon={FiPauseCircle}
                    label="Inactive shops"
                    value={items.length - activeCount}
                    hint="Currently disabled"
                    tone="bg-amber-50 text-amber-600"
                />
                <SummaryCard
                    icon={FiUsers}
                    label="Team members"
                    value={staffCount}
                    hint="Assigned across shops"
                    tone="bg-sky-50 text-sky-600"
                />
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <label className="min-w-[240px] flex-1">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                        Search shops
                    </span>
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Name, code, address, phone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </label>
                <label className="w-44">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                        Status
                    </span>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </label>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex h-[38px] items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        <FiX className="h-4 w-4" /> Clear
                    </button>
                )}
            </div>

            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={filteredItems.length === 0}
                emptyText={
                    hasFilters
                        ? "No shops match your filters."
                        : "No shops yet. Add your first shop to get started."
                }
            >
                {filteredItems.map((shop, index) => (
                    <tr
                        key={shop.id}
                        className="transition hover:bg-slate-50/80"
                    >
                        <td className="px-4 py-3 text-center text-xs font-medium tabular-nums text-slate-400">
                            {index + 1}
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <FiHome className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">
                                        {shop.name}
                                    </p>
                                    <p className="font-mono text-xs text-slate-400">
                                        {shop.code}
                                    </p>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <FiPhone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span>{shop.phone ?? "—"}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <FiMapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="truncate">
                                    {shop.address ?? "No address"}
                                </span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                <FiUsers className="h-4 w-4 text-slate-400" />
                                <span className="tabular-nums">
                                    {shop.users_count ?? 0}
                                </span>
                            </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Badge
                                tone={shop.is_active ? "green" : "slate"}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${shop.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                                    />
                                    {shop.is_active ? "Active" : "Inactive"}
                                </span>
                            </Badge>
                        </td>
                        {showActions && (
                            <RowActions
                                onEdit={
                                    can("shops.update")
                                        ? () => setEditing(shop)
                                        : null
                                }
                                onDelete={
                                    can("shops.delete")
                                        ? () => handleDelete(shop)
                                        : null
                                }
                            />
                        )}
                    </tr>
                ))}
            </Table>
            {editing && (
                <Modal
                    title={editing.id ? "Edit shop" : "Add shop"}
                    onClose={() => setEditing(null)}
                >
                    <ShopForm
                        shop={editing.id ? editing : null}
                        onCancel={() => setEditing(null)}
                        onSaved={() => {
                            setEditing(null);
                            reload();
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}
