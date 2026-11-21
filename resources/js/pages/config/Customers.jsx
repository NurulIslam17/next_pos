import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import Modal from '../../components/Modal';
import { ErrorBanner, Field, FormActions, inputClass, PageHeader, primaryButton, RowActions, secondaryButton, Table, useList, useSubmit } from '../../components/ui';

function CustomerForm({ customer, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: customer?.name ?? '',
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
    });
    const { first, message, isSaving, submit } = useSubmit();
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() => api(customer ? `/customers/${customer.id}` : '/customers', {
            method: customer ? 'PUT' : 'POST',
            body: form,
        }));
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <Field label="Name" error={first('name')}>
                <input className={inputClass} value={form.name} onChange={set('name')} required />
            </Field>
            <Field label="Phone" error={first('phone')}>
                <input className={inputClass} value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Address" error={first('address')}>
                <textarea rows={3} className={inputClass} value={form.address} onChange={set('address')} />
            </Field>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function Customers() {
    const { can } = useAuth();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const { items, meta, isLoading, error, reload, setError } = useList('/customers', { search: query, page, per_page: 10 });
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (customer) => {
        if (!window.confirm(`Delete ${customer.name}?`)) return;
        try {
            await api(`/customers/${customer.id}`, { method: 'DELETE' });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can('customers.update') || can('customers.delete');
    const columns = [
        { label: 'SL' },
        { label: 'Name' },
        { label: 'Phone' },
        { label: 'Address' },
        { label: 'Created By' },
        ...(showActions ? [{ label: 'Actions' }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="Customers" subtitle={meta ? `${meta.total} customers` : undefined}>
                <input
                    type="search"
                    placeholder="Search name, phone, address…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {can('customers.create') && <button onClick={() => setEditing({})} className={primaryButton}><FiPlus className="h-4 w-4" /> Add customer</button>}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table columns={columns} isLoading={isLoading} isEmpty={items.length === 0} emptyText="No customers found.">
                {items.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">{((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 10) + index + 1}</td>
                        <td className="px-4 py-3 text-center font-medium">{customer.name}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{customer.phone ?? '—'}</td>
                        <td className="max-w-md px-4 py-3 text-center text-slate-600">{customer.address ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{customer.created_by_name ?? '—'}</td>
                        {showActions && (
                            <RowActions
                                onEdit={can('customers.update') ? () => setEditing(customer) : null}
                                onDelete={can('customers.delete') ? () => handleDelete(customer) : null}
                            />
                        )}
                    </tr>
                ))}
            </Table>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={secondaryButton}>
                            <FiChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} className={secondaryButton}>
                            Next <FiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {editing && (
                <Modal title={editing.id ? 'Edit customer' : 'Add customer'} onClose={() => setEditing(null)}>
                    <CustomerForm customer={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
                </Modal>
            )}
        </div>
    );
}
