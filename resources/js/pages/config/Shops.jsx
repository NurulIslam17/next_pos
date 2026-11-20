import { useState } from "react";
import { FiPlus } from "react-icons/fi";
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <div className="grid grid-cols-2 gap-4">
                <Field label="Shop name" error={first("name")}>
                    <input
                        className={inputClass}
                        value={form.name}
                        onChange={set("name")}
                        required
                    />
                </Field>
                <Field label="Code" error={first("code")}>
                    <input
                        className={inputClass}
                        value={form.code}
                        onChange={set("code")}
                        placeholder="SHOP-09"
                        required
                    />
                </Field>
            </div>
            <Field label="Address" error={first("address")}>
                <input
                    className={inputClass}
                    value={form.address}
                    onChange={set("address")}
                />
            </Field>
            <Field label="Phone" error={first("phone")}>
                <input
                    className={inputClass}
                    value={form.phone}
                    onChange={set("phone")}
                />
            </Field>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={set("is_active")}
                />{" "}
                Active
            </label>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function Shops() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList("/shops");
    const [editing, setEditing] = useState(null);

    const handleDelete = async (shop) => {
        if (!window.confirm(`Delete ${shop.name}?`)) return;
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
        { label: "Code" },
        { label: "Shop" },
        { label: "Address" },
        { label: "Phone" },
        { label: "Staff", className: "" },
        { label: "Status" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="Shops" subtitle={`${items.length} shops`}>
                {can("shops.create") && (
                    <button
                        onClick={() => setEditing({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add shop
                    </button>
                )}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={items.length === 0}
            >
                {items.map((shop, index) => (
                    <tr key={shop.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-mono text-xs">
                            {index + 1}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                            {shop.code}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                            {shop.name}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {shop.address ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {shop.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                            {shop.users_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Badge tone={shop.is_active ? "green" : "slate"}>
                                {shop.is_active ? "Active" : "Inactive"}
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
