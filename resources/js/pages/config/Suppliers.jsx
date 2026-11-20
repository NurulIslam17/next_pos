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

function SupplierForm({ supplier, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: supplier?.name ?? "",
        phone: supplier?.phone ?? "",
        email: supplier?.email ?? "",
        address: supplier?.address ?? "",
        nid_number: supplier?.nid_number ?? "",
        tin_number: supplier?.tin_number ?? "",
        trade_license_number: supplier?.trade_license_number ?? "",
        occupation: supplier?.occupation ?? "",
        is_active: supplier?.is_active ?? true,
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
            api(supplier ? `/suppliers/${supplier.id}` : "/suppliers", {
                method: supplier ? "PUT" : "POST",
                body: form,
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <div className="grid grid-cols-2 gap-4">
                <Field label="Supplier name" error={first("name")}>
                    <input
                        className={inputClass}
                        value={form.name}
                        onChange={set("name")}
                        required
                    />
                </Field>
                <Field label="Phone" error={first("phone")}>
                    <input
                        className={inputClass}
                        value={form.phone}
                        onChange={set("phone")}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Email" error={first("email")}>
                    <input
                        type="email"
                        className={inputClass}
                        value={form.email}
                        onChange={set("email")}
                    />
                </Field>
                <Field label="Occupation" error={first("occupation")}>
                    <input
                        className={inputClass}
                        value={form.occupation}
                        onChange={set("occupation")}
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
            <div className="grid grid-cols-3 gap-4">
                <Field label="NID number" error={first("nid_number")}>
                    <input
                        className={inputClass}
                        value={form.nid_number}
                        onChange={set("nid_number")}
                    />
                </Field>
                <Field label="TIN number" error={first("tin_number")}>
                    <input
                        className={inputClass}
                        value={form.tin_number}
                        onChange={set("tin_number")}
                    />
                </Field>
                <Field
                    label="Trade license number"
                    error={first("trade_license_number")}
                >
                    <input
                        className={inputClass}
                        value={form.trade_license_number}
                        onChange={set("trade_license_number")}
                    />
                </Field>
            </div>
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

export default function Suppliers() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList("/suppliers");
    const [editing, setEditing] = useState(null);

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Delete ${supplier.name}?`)) return;
        try {
            await api(`/suppliers/${supplier.id}`, { method: "DELETE" });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("suppliers.update") || can("suppliers.delete");
    const columns = [
        { label: "SL" },
        { label: "Name" },
        { label: "Phone" },
        { label: "Occupation" },
        { label: "NID" },
        { label: "TIN" },
        { label: "Trade License" },
        { label: "Status" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Suppliers"
                subtitle={`${items.length} suppliers`}
            >
                {can("suppliers.create") && (
                    <button
                        onClick={() => setEditing({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add supplier
                    </button>
                )}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={items.length === 0}
            >
                {items.map((supplier,index) => (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">
                            {index + 1}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                            {supplier.name}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {supplier.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {supplier.occupation ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {supplier.nid_number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {supplier.tin_number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {supplier.trade_license_number ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Badge
                                tone={supplier.is_active ? "green" : "slate"}
                            >
                                {supplier.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </td>
                        {showActions && (
                            <RowActions
                                onEdit={
                                    can("suppliers.update")
                                        ? () => setEditing(supplier)
                                        : null
                                }
                                onDelete={
                                    can("suppliers.delete")
                                        ? () => handleDelete(supplier)
                                        : null
                                }
                            />
                        )}
                    </tr>
                ))}
            </Table>
            {editing && (
                <Modal
                    title={editing.id ? "Edit supplier" : "Add supplier"}
                    onClose={() => setEditing(null)}
                    wide={true}
                >
                    <SupplierForm
                        supplier={editing.id ? editing : null}
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
