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

const PROTECTED_ROLE = "super_admin";
const titleCase = (value) =>
    value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function RoleForm({ role, permissions, onSaved, onCancel }) {
    const [name, setName] = useState(role?.name ?? "");
    const [selected, setSelected] = useState(new Set(role?.permissions ?? []));
    const { first, message, isSaving, submit } = useSubmit();

    // { module: [{ name, action }] }
    const groups = useMemo(() => {
        const result = {};
        permissions.forEach((permission) => {
            const [module, action] = permission.name.split(".");
            (result[module] ??= []).push({ name: permission.name, action });
        });
        return result;
    }, [permissions]);

    const toggle = (permissionName) => {
        const next = new Set(selected);
        next.has(permissionName)
            ? next.delete(permissionName)
            : next.add(permissionName);
        setSelected(next);
    };

    const toggleModule = (items) => {
        const next = new Set(selected);
        const allOn = items.every((item) => next.has(item.name));
        items.forEach((item) =>
            allOn ? next.delete(item.name) : next.add(item.name),
        );
        setSelected(next);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() =>
            api(role ? `/roles/${role.id}` : "/roles", {
                method: role ? "PUT" : "POST",
                body: { name, permissions: [...selected] },
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <Field label="Role name" error={first("name")}>
                <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="shop_assistant"
                    required
                />
            </Field>

            <div>
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Permissions</span>
                    <span className="text-xs font-normal text-slate-500">
                        {selected.size} selected
                    </span>
                </div>
                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                    {Object.entries(groups).map(([module, items]) => (
                        <div
                            key={module}
                            className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-2"
                        >
                            <label className="flex w-32 items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={items.every((item) =>
                                        selected.has(item.name),
                                    )}
                                    onChange={() => toggleModule(items)}
                                />
                                {titleCase(module)}
                            </label>
                            {items.map((item) => (
                                <label
                                    key={item.name}
                                    className="flex items-center gap-1.5 text-sm text-slate-600"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(item.name)}
                                        onChange={() => toggle(item.name)}
                                    />
                                    {item.action}
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function Roles() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList("/roles");
    const [permissions, setPermissions] = useState([]);
    const [editing, setEditing] = useState(null);

    const openForm = async (role) => {
        try {
            const response = await api("/permissions");
            setPermissions(response.data);
            setEditing(role);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = async (role) => {
        if (!window.confirm(`Delete role "${role.name}"?`)) return;
        try {
            await api(`/roles/${role.id}`, { method: "DELETE" });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("roles.update") || can("roles.delete");
    const columns = [
        { label: "SL" },
        { label: "Role" },
        { label: "Permissions", className: "" },
        { label: "Users", className: "" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Roles"
                subtitle="Group permissions into roles and assign them to users."
            >
                {can("roles.create") && can("permissions.view") && (
                    <button
                        onClick={() => openForm({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add role
                    </button>
                )}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={items.length === 0}
            >
                {items.map((role, index) => {
                    const isProtected = role.name === PROTECTED_ROLE;
                    return (
                        <tr key={role.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-center font-medium">
                                {index + 1}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                                {titleCase(role.name)}{" "}
                                {isProtected && (
                                    <Badge tone="amber">Full access</Badge>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {role.permissions.length}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {role.users_count}
                            </td>
                            {showActions &&
                                (isProtected ? (
                                    <td className="px-4 py-3 text-center">
                                        UNIVERSAL ROLE
                                    </td>
                                ) : (
                                    <RowActions
                                        onEdit={
                                            can("roles.update") &&
                                            can("permissions.view")
                                                ? () => openForm(role)
                                                : null
                                        }
                                        onDelete={
                                            can("roles.delete")
                                                ? () => handleDelete(role)
                                                : null
                                        }
                                    />
                                ))}
                        </tr>
                    );
                })}
            </Table>
            {editing && (
                <Modal
                    title={
                        editing.id
                            ? `Edit role: ${titleCase(editing.name)}`
                            : "Add role"
                    }
                    onClose={() => setEditing(null)}
                >
                    <RoleForm
                        role={editing.id ? editing : null}
                        permissions={permissions}
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
