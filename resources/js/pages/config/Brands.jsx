import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import Modal from '../../components/Modal';
import { Badge, ErrorBanner, Field, FormActions, inputClass, PageHeader, primaryButton, RowActions, Table, useList, useSubmit } from '../../components/ui';

function BrandForm({ brand, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: brand?.name ?? '',
        description: brand?.description ?? '',
        status: brand?.status ?? true,
    });
    const { first, message, isSaving, submit } = useSubmit();
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await submit(() => api(brand ? `/brands/${brand.id}` : '/brands', { method: brand ? 'PUT' : 'POST', body: form }));
        if (ok) onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            <Field label="Brand name" error={first('name')}>
                <input className={inputClass} value={form.name} onChange={set('name')} required />
            </Field>
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

export default function Brands() {
    const { can } = useAuth();
    const { items, isLoading, error, reload, setError } = useList('/brands');
    const [editing, setEditing] = useState(null);

    const handleDelete = async (brand) => {
        if (!window.confirm(`Delete ${brand.name}?`)) return;
        try {
            await api(`/brands/${brand.id}`, { method: 'DELETE' });
            reload();
        } catch (e) {
            setError(e.message);
        }
    };

    const showActions = can('brands.update') || can('brands.delete');
    const columns = [
        { label: 'SL' },{ label: 'Name' }, { label: 'Description' }, { label: 'Created By' }, { label: 'Status' }, { label: 'Created At' },
        ...(showActions ? [{ label: 'Actions' }] : []),
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="Brands" subtitle={`${items.length} brands`}>
                {can('brands.create') && <button onClick={() => setEditing({})} className={primaryButton}><FiPlus className="h-4 w-4" /> Add brand</button>}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table columns={columns} isLoading={isLoading} isEmpty={items.length === 0}>
                {items.map((brand,index) => (
                    <tr key={brand.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-center font-medium">{brand.name}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{brand.description ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{brand.created_by_name ?? '—'}</td>
                        <td className="px-4 py-3 text-center"><Badge tone={brand.status ? 'green' : 'slate'}>{brand.status ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-4 py-3 text-center text-slate-600">{brand.created_at}</td>
                        {showActions && (
                            <RowActions onEdit={can('brands.update') ? () => setEditing(brand) : null} onDelete={can('brands.delete') ? () => handleDelete(brand) : null} />
                        )}
                    </tr>
                ))}
            </Table>
            {editing && (
                <Modal title={editing.id ? 'Edit brand' : 'Add brand'} onClose={() => setEditing(null)}>
                    <BrandForm brand={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
                </Modal>
            )}
        </div>
    );
}
