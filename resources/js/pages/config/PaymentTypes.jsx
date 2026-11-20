import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import Modal from '../../components/Modal';
import { Badge, ErrorBanner, Field, FormActions, inputClass, PageHeader, primaryButton, RowActions, Table, useList, useSubmit } from '../../components/ui';

function PaymentTypeForm({ paymentType, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: paymentType?.name ?? '',
        code: paymentType?.code ?? '',
        description: paymentType?.description ?? '',
        status: paymentType?.status ?? true,
    });
    const { first, message, isSaving, submit } = useSubmit();
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() => api(paymentType ? `/payment-types/${paymentType.id}` : '/payment-types', {
            method: paymentType ? 'PUT' : 'POST',
            body: form,
        }));
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment type name" error={first('name')}>
                    <input className={inputClass} value={form.name} onChange={set('name')} required />
                </Field>
                <Field label="Code" error={first('code')}>
                    <input className={inputClass} value={form.code} onChange={set('code')} placeholder="CASH" required />
                </Field>
            </div>
            <Field label="Description" error={first('description')}>
                <textarea rows={3} className={inputClass} value={form.description} onChange={set('description')} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.status} onChange={set('status')} /> Active
            </label>
            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default function PaymentTypes() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList('/payment-types');
    const [editing, setEditing] = useState(null);

    const handleDelete = async (paymentType) => {
        if (!window.confirm(`Delete ${paymentType.name}?`)) return;
        try {
            await api(`/payment-types/${paymentType.id}`, { method: 'DELETE' });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can('payment_types.update') || can('payment_types.delete');
    const columns = [
        { label: 'SL' },
        { label: 'Name' },
        { label: 'Code' },
        { label: 'Description' },
        { label: 'Created By' },
        { label: 'Status' },
        { label: 'Created At' },
        ...(showActions ? [{ label: 'Actions' }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="Payment Types" subtitle={`${items.length} payment types`}>
                {can('payment_types.create') && <button onClick={() => setEditing({})} className={primaryButton}><FiPlus className="h-4 w-4" /> Add payment type</button>}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table columns={columns} isLoading={isLoading} isEmpty={items.length === 0}>
                {items.map((paymentType, index) => (
                    <tr key={paymentType.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-center font-medium">{paymentType.name}</td>
                        <td className="px-4 py-3 text-center"><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{paymentType.code}</span></td>
                        <td className="px-4 py-3 text-center text-slate-600">{paymentType.description ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{paymentType.created_by_name ?? '—'}</td>
                        <td className="px-4 py-3 text-center"><Badge tone={paymentType.status ? 'green' : 'slate'}>{paymentType.status ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-4 py-3 text-center text-slate-600">{paymentType.created_at}</td>
                        {showActions && (
                            <RowActions
                                onEdit={can('payment_types.update') ? () => setEditing(paymentType) : null}
                                onDelete={can('payment_types.delete') ? () => handleDelete(paymentType) : null}
                            />
                        )}
                    </tr>
                ))}
            </Table>
            {editing && (
                <Modal title={editing.id ? 'Edit payment type' : 'Add payment type'} onClose={() => setEditing(null)}>
                    <PaymentTypeForm paymentType={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
                </Modal>
            )}
        </div>
    );
}
