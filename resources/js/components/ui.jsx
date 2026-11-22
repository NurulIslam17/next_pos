import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { api, ApiError } from '../api';

export const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

// Every button shares one base so heights, borders and radius line up everywhere.
const buttonBase =
    'inline-flex h-[38px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50';
const rowButtonBase =
    'inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40';

export const primaryButton = `${buttonBase} border-indigo-600 bg-indigo-600 text-white hover:border-indigo-500 hover:bg-indigo-500`;
export const secondaryButton = `${buttonBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
export const dangerButton = `${buttonBase} border-red-600 bg-red-600 text-white hover:border-red-500 hover:bg-red-500`;
export const rowEditButton = `${rowButtonBase} border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50`;
export const rowDeleteButton = `${rowButtonBase} border-red-200 bg-white text-red-600 hover:bg-red-50`;

export function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {children}
            {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
        </label>
    );
}

export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex gap-2">{children}</div>
        </div>
    );
}

export function ErrorBanner({ message }) {
    return message ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div> : null;
}

export function Badge({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-600',
        green: 'bg-emerald-50 text-emerald-700',
        indigo: 'bg-indigo-50 text-indigo-700',
        amber: 'bg-amber-50 text-amber-700',
    };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Table({ columns, isLoading, isEmpty, emptyText = 'Nothing here yet.', children }) {
    return (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} className={`px-4 py-3 text-center ${column.className ?? ''}`}>{column.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {isLoading && (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">Loading…</td>
                        </tr>
                    )}
                    {!isLoading && isEmpty && (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">{emptyText}</td>
                        </tr>
                    )}
                    {!isLoading && children}
                </tbody>
            </table>
        </div>
    );
}

export function RowActions({ onEdit, onDelete }) {
    return (
        <td className="whitespace-nowrap px-4 py-3 text-center">
            {onEdit && (
                <button onClick={onEdit} className={`${rowEditButton} mr-2`}>
                    <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </button>
            )}
            {onDelete && (
                <button onClick={onDelete} className={rowDeleteButton}>
                    <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
            )}
        </td>
    );
}

/** Loads a list endpoint and exposes reload(); `unwrap` picks the array from the response. */
export function useList(path, params) {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState(null);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const key = JSON.stringify(params ?? {});

    const reload = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api(path, { params: JSON.parse(key) });
            setItems(response.data);
            setMeta(response.meta ?? null);
            setSummary(response.summary ?? null);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [path, key]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { items, meta, summary, isLoading, error, reload, setError };
}

/** Wraps a save/delete call, returning field errors from validation failures. */
export function useSubmit() {
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const submit = async (request) => {
        setIsSaving(true);
        setErrors({});
        setMessage('');
        try {
            await request();
            return true;
        } catch (e) {
            if (e instanceof ApiError) {
                setErrors(e.errors);
                setMessage(e.message);
            }
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { errors, message, isSaving, submit, first: (key) => errors[key]?.[0] };
}

export function FormActions({ isSaving, onCancel }) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className={secondaryButton}>
                <FiX className="h-4 w-4" /> Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButton}>
                <FiSave className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}
            </button>
        </div>
    );
}
