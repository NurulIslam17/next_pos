import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { api } from "../../api";
import { useAuth } from "../../auth";
import Modal from "../../components/Modal";
import UserPhoto from "../../components/UserPhoto";
import {
    Badge,
    ErrorBanner,
    Field,
    FormActions,
    inputClass,
    PageHeader,
    primaryButton,
    RowActions,
    secondaryButton,
    Table,
    useList,
    useSubmit,
} from "../../components/ui";

const titleCase = (value) =>
    value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const parts = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).formatToParts(date);
    const part = (type) =>
        parts.find((item) => item.type === type)?.value ?? "";
    return `${part("day")} ${part("month")} ${part("year")} at ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
};

function UserForm({ user, roles, shops, onSaved, onCancel }) {
    const isEdit = Boolean(user);
    const [form, setForm] = useState({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
        phone: user?.phone ?? "",
        shop_id: user?.shop_id ?? "",
        nid_number: user?.nid_number ?? "",
        date_of_birth: user?.date_of_birth ?? "",
        joining_date: user?.joining_date ?? "",
        salary: user?.salary ?? "",
        permanent_address: user?.permanent_address ?? "",
        present_address: user?.present_address ?? "",
        bank_name: user?.bank_name ?? "",
        salary_account_name: user?.salary_account_name ?? "",
        salary_account_number: user?.salary_account_number ?? "",
        is_active: user?.is_active ?? true,
    });
    const [selectedRoles, setSelectedRoles] = useState(user?.roles ?? []);
    const { first, message, isSaving, submit } = useSubmit();

    const set = (key) => (e) =>
        setForm({
            ...form,
            [key]:
                e.target.type === "checkbox"
                    ? e.target.checked
                    : e.target.value,
        });
    const toggleRole = (name) =>
        setSelectedRoles(
            selectedRoles.includes(name)
                ? selectedRoles.filter((r) => r !== name)
                : [...selectedRoles, name],
        );

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Empty strings become null so optional columns are cleared rather than stored as "".
        const body = Object.fromEntries(
            Object.entries(form).map(([key, value]) => [
                key,
                value === "" ? null : value,
            ]),
        );
        if (!body.password) delete body.password;
        body.roles = selectedRoles;

        const ok = await submit(() =>
            api(isEdit ? `/users/${user.id}` : "/users", {
                method: isEdit ? "PUT" : "POST",
                body,
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={message} />

            <fieldset className="space-y-4">
                <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={first("name")}>
                        <input
                            className={inputClass}
                            value={form.name}
                            onChange={set("name")}
                            required
                        />
                    </Field>
                    <Field label="Email" error={first("email")}>
                        <input
                            type="email"
                            className={inputClass}
                            value={form.email}
                            onChange={set("email")}
                            required
                        />
                    </Field>
                    <Field
                        label={
                            isEdit
                                ? "New password (leave blank to keep)"
                                : "Password"
                        }
                        error={first("password")}
                    >
                        <input
                            type="password"
                            className={inputClass}
                            value={form.password}
                            onChange={set("password")}
                            required={!isEdit}
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </Field>
                    <Field label="Phone number" error={first("phone")}>
                        <input
                            className={inputClass}
                            value={form.phone}
                            onChange={set("phone")}
                        />
                    </Field>
                    <Field label="Shop" error={first("shop_id")}>
                        <select
                            className={inputClass}
                            value={form.shop_id}
                            onChange={set("shop_id")}
                        >
                            <option value="">— All shops / none —</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div>
                    <div className="text-sm font-medium">Roles</div>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                        {roles.map((role) => (
                            <label
                                key={role.id}
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedRoles.includes(role.name)}
                                    onChange={() => toggleRole(role.name)}
                                />
                                {titleCase(role.name)}
                            </label>
                        ))}
                    </div>
                    {first("roles") && (
                        <span className="mt-1 block text-xs text-red-600">
                            {first("roles")}
                        </span>
                    )}
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Personal & payroll
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="NID number" error={first("nid_number")}>
                        <input
                            className={inputClass}
                            value={form.nid_number}
                            onChange={set("nid_number")}
                        />
                    </Field>
                    <Field label="Date of birth" error={first("date_of_birth")}>
                        <input
                            type="date"
                            className={inputClass}
                            value={form.date_of_birth}
                            onChange={set("date_of_birth")}
                        />
                    </Field>
                    <Field label="Joining date" error={first("joining_date")}>
                        <input
                            type="date"
                            className={inputClass}
                            value={form.joining_date}
                            onChange={set("joining_date")}
                        />
                    </Field>
                    <Field label="Salary" error={first("salary")}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            value={form.salary}
                            onChange={set("salary")}
                        />
                    </Field>
                    <Field label="Bank name" error={first("bank_name")}>
                        <input
                            className={inputClass}
                            value={form.bank_name}
                            onChange={set("bank_name")}
                        />
                    </Field>
                    <Field
                        label="Salary account name"
                        error={first("salary_account_name")}
                    >
                        <input
                            className={inputClass}
                            value={form.salary_account_name}
                            onChange={set("salary_account_name")}
                        />
                    </Field>
                    <Field
                        label="Salary account number"
                        error={first("salary_account_number")}
                    >
                        <input
                            className={inputClass}
                            value={form.salary_account_number}
                            onChange={set("salary_account_number")}
                        />
                    </Field>
                </div>
                <Field
                    label="Permanent address"
                    error={first("permanent_address")}
                >
                    <input
                        className={inputClass}
                        value={form.permanent_address}
                        onChange={set("permanent_address")}
                    />
                </Field>
                <Field label="Present address" error={first("present_address")}>
                    <input
                        className={inputClass}
                        value={form.present_address}
                        onChange={set("present_address")}
                    />
                </Field>
            </fieldset>

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

export default function Users() {
    const { user: me, can } = useAuth();
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const { items, meta, isLoading, error, reload, setError } = useList(
        "/users",
        { search: query, page, per_page: 15 },
    );
    const [lookups, setLookups] = useState({ roles: [], shops: [] });
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Roles and shops feed the form's dropdowns; a missing permission just leaves a list empty.
    const openForm = async (user) => {
        const [roles, shops] = await Promise.all([
            can("roles.view")
                ? api("/roles")
                      .then((r) => r.data)
                      .catch(() => [])
                : [],
            can("shops.view")
                ? api("/shops")
                      .then((r) => r.data)
                      .catch(() => [])
                : [],
        ]);
        setLookups({ roles, shops });
        setEditing(user);
    };

    const openEdit = async (user) => {
        try {
            const response = await api(`/users/${user.id}`);
            await openForm(response.data);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.name}?`)) return;
        try {
            await api(`/users/${user.id}`, { method: "DELETE" });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("users.update") || can("users.delete");
    const columns = [
        { label: "SL" },
        { label: "Photo" },
        { label: "Name" },
        { label: "Email" },
        { label: "Phone" },
        { label: "Role" },
        { label: "Shop" },
        { label: "Last updated at" },
        { label: "Status" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Users"
                subtitle={meta ? `${meta.total} users` : undefined}
            >
                <input
                    type="search"
                    placeholder="Search name, email, phone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {can("users.create") && (
                    <button
                        onClick={() => openForm({})}
                        className={primaryButton}
                    >
                        <FiPlus className="h-4 w-4" /> Add user
                    </button>
                )}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={items.length === 0}
                emptyText="No users found."
            >
                {items.map((user,index) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-center">
                            <UserPhoto user={user} className="mx-auto h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" />
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {user.email}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {user.phone ?? "—"}
                        </td>
                        <td className="space-x-1 px-4 py-3 text-center">
                            {user.roles.length ? (
                                user.roles.map((role) => (
                                    <Badge key={role} tone="indigo">
                                        {titleCase(role)}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-slate-400">—</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {user.shop ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600">
                            {formatDateTime(user.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Badge tone={user.is_active ? "green" : "slate"}>
                                {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </td>
                        {showActions && (
                            <RowActions
                                onEdit={
                                    can("users.update")
                                        ? () => openEdit(user)
                                        : null
                                }
                                onDelete={
                                    can("users.delete") && user.id !== me.id
                                        ? () => handleDelete(user)
                                        : null
                                }
                            />
                        )}
                    </tr>
                ))}
            </Table>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        Page {meta.current_page} of {meta.last_page}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className={secondaryButton}
                        >
                            <FiChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            disabled={page >= meta.last_page}
                            onClick={() => setPage(page + 1)}
                            className={secondaryButton}
                        >
                            Next <FiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {editing && (
                <Modal
                    title={editing.id ? "Edit user" : "Add user"}
                    onClose={() => setEditing(null)}
                    wide={true}
                >
                    <UserForm
                        user={editing.id ? editing : null}
                        roles={lookups.roles}
                        shops={lookups.shops}
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
