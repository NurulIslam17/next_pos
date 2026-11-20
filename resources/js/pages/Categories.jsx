import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Modal from "../components/Modal";
import {
    ErrorBanner,
    Field,
    FormActions,
    inputClass,
    primaryButton,
    RowActions,
    secondaryButton,
    Table,
    useSubmit,
} from "../components/ui";

function CategoryForm({ category, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: category?.name ?? "",
        description: category?.description ?? "",
    });
    const { first, message, isSaving, submit } = useSubmit();
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() =>
            api(category ? `/categories/${category.id}` : "/categories", {
                method: category ? "PUT" : "POST",
                body: form,
            }),
        );
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <Field label="Category name" error={first("name")}>
                <input
                    className={inputClass}
                    value={form.name}
                    onChange={set("name")}
                    required
                />
            </Field>
            <Field label="Description" error={first("description")}>
                <textarea
                    rows={3}
                    className={inputClass}
                    value={form.description}
                    onChange={set("description")}
                />
            </Field>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function Categories() {
    const { can } = useAuth();
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await api("/categories", {
                params: { search: query, page, per_page: 10 },
            });
            setCategories(response.data);
            setMeta(response.meta);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [page, query]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (category) => {
        if (!window.confirm(`Delete ${category.name}?`)) return;
        try {
            await api(`/categories/${category.id}`, { method: "DELETE" });
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can("categories.update") || can("categories.delete");
    const columns = [
        { label: "SL" },
        { label: "Name" },
        { label: "Description" },
        { label: "Created By" },
        { label: "Created At" },
        { label: "Products", className: "" },
        ...(showActions ? [{ label: "Actions" }] : []),
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Categories</h1>
                    {meta && (
                        <p className="text-sm text-slate-500">
                            {meta.total.toLocaleString()} categories
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="search"
                        placeholder="Search categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {can("categories.create") && (
                        <button
                            onClick={() => setEditing({})}
                            className={primaryButton}
                        >
                            <FiPlus className="h-4 w-4" /> Add category
                        </button>
                    )}
                </div>
            </div>

            <ErrorBanner message={error} />
            <Table
                columns={columns}
                isLoading={isLoading}
                isEmpty={categories.length === 0}
            >
                {categories.map((category,index) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">
                            {index + 1}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                            {category.name}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {category.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {category.created_by_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                            {category.created_at ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                            <Link
                                to={`/products?category_id=${category.id}`}
                                className="text-indigo-600 hover:underline"
                            >
                                {category.products_count}
                            </Link>
                        </td>
                        {showActions && (
                            <RowActions
                                onEdit={
                                    can("categories.update")
                                        ? () => setEditing(category)
                                        : null
                                }
                                onDelete={
                                    can("categories.delete")
                                        ? () => handleDelete(category)
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
                    title={editing.id ? "Edit category" : "Add category"}
                    onClose={() => setEditing(null)}
                >
                    <CategoryForm
                        category={editing.id ? editing : null}
                        onCancel={() => setEditing(null)}
                        onSaved={() => {
                            setEditing(null);
                            load();
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}
