import { useMemo, useState } from "react";
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

function PermissionForm({ permission, onSaved, onCancel }) {
    const [name, setName] = useState(permission?.name ?? "");
    const { first, message, isSaving, submit } = useSubmit();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() =>
            api(permission ? `/permissions/${permission.id}` : "/permissions", {
                method: permission ? "PUT" : "POST",
                body: { name },
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <Field label="Permission name" error={first("name")}>
                <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="reports.view"
                    required
                    autoFocus
                />
            </Field>
            <p className="text-xs text-slate-500">
                Use the module.action format, for example reports.view or
                sales.create.
            </p>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function Permissions() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } =
        useList("/permissions");
    const [editing, setEditing] = useState(null);

    const sorted = useMemo(
        () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
        [items],
    );

    const handleDelete = async (permission) => {
        if (
            !window.confirm(
                `Delete permission "${permission.name}"? Roles will lose it.`,
            )
        )
            return;
        try {
            await api(`/permissions/${permission.id}`, { method: "DELETE" });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("permissions.update") || can("permissions.delete");
    const columns = [
        { label: "Module" , className: "text-left"},
        { label: "Action" },
        { label: "Permission" },
        { label: "Roles", className: "" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Permissions"
                subtitle={`${items.length} permissions`}
            >
                {can("permissions.create") && (
                    <button
                        onClick={() => setEditing({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add permission
                    </button>
                )}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={items.length === 0}
            >
                {sorted.map((permission, index) => {
                    const [module, action] = permission.name.split(".");
                    return (
                        <tr key={permission.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-left font-medium capitalize">
                                {module}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <Badge tone="indigo">{action}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-600">
                                {permission.name}
                            </td>
                            <td className="px-4 py-3 text-center tabular-nums">
                                {permission.roles_count}
                            </td>
                            {showActions && (
                                <RowActions
                                    onEdit={
                                        can("permissions.update")
                                            ? () => setEditing(permission)
                                            : null
                                    }
                                    onDelete={
                                        can("permissions.delete")
                                            ? () => handleDelete(permission)
                                            : null
                                    }
                                />
                            )}
                        </tr>
                    );
                })}
            </Table>
            {editing && (
                <Modal
                    title={editing.id ? "Rename permission" : "Add permission"}
                    onClose={() => setEditing(null)}
                >
                    <PermissionForm
                        permission={editing.id ? editing : null}
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
