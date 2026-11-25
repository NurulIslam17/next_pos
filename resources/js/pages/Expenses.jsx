import { useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth';
import Modal from '../components/Modal';
import { Badge, ErrorBanner, Field, inputClass, PageHeader, Table, primaryButton, rowDeleteButton, rowEditButton, secondaryButton, useList, useSubmit } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value ?? 0).toFixed(2);

function ExpenseForm({ expense = null, shops = [], isManager = false, onSaved, onCancel }) {
    const [form, setForm] = useState({
        expense_date: expense?.expense_date ?? today(),
        shop_id: expense?.shop_id ?? (isManager ? '' : ''),
        category: expense?.category ?? '',
        reference_no: expense?.reference_no ?? '',
        amount: expense?.amount ?? '',
        note: expense?.note ?? '',
    });
    const { isSaving, message: error, errors, submit, first } = useSubmit();
    const save = async () => {
        const ok = await submit(() => api(expense ? `/expenses/${expense.id}` : '/expenses', { method: expense ? 'PUT' : 'POST', body: { ...form, shop_id: form.shop_id || null, amount: Number(form.amount) } }));
        if (ok) onSaved();
    };
    const set = (key) => (e) => setForm((c) => ({ ...c, [key]: e.target.value }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
            <ErrorBanner message={error} />
            <div className="grid grid-cols-2 gap-4">
                <Field label="Date" error={first('expense_date')}><input type="date" value={form.expense_date} onChange={set('expense_date')} className={inputClass} required /></Field>
                <Field label="Shop" error={first('shop_id')}>
                    <select value={form.shop_id} onChange={set('shop_id')} className={inputClass} disabled={isManager}>
                        <option value="">Select shop</option>
                        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name} ({shop.code})</option>)}
                    </select>
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Category" error={first('category')}><input value={form.category} onChange={set('category')} className={inputClass} required maxLength={100} /></Field>
                <Field label="Reference No" error={first('reference_no')}><input value={form.reference_no} onChange={set('reference_no')} className={inputClass} maxLength={100} /></Field>
            </div>
            <Field label="Amount" error={first('amount')}><input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} className={inputClass} required /></Field>
            <Field label="Note" error={first('note')}><textarea value={form.note} onChange={set('note')} className={inputClass} rows={3} /></Field>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button>
                <button type="submit" disabled={isSaving} className={primaryButton}>{isSaving ? 'Saving…' : 'Save'}</button>
            </div>
        </form>
    );
}

export default function Expenses() {
    const { user, can } = useAuth();
    const isManager = user?.role === 'manager' || user?.roles?.includes('manager');
    const [editing, setEditing] = useState(null);
    const { items, meta, isLoading, error, setError, reload } = useList('/expenses');
    const shopsState = useList('/shops', {}, { enabled: can('shops.view') });
    const shops = shopsState.items ?? [];

    const handleDelete = async (expense) => {
        if (!window.confirm(`Delete expense "${expense.category}"?`)) return;
        try { await api(`/expenses/${expense.id}`, { method: 'DELETE' }); reload(); } catch (e) { setError(e.message); }
    };

    return (
        <div className="space-y-4">
            <PageHeader title="Expenses" subtitle={meta ? `${meta.total} expenses` : 'Track daily expenses'}>
                {can('expenses.create') && <button onClick={() => setEditing({})} className={primaryButton}><FiPlus className="h-4 w-4" /> Add Expense</button>}
            </PageHeader>
            <ErrorBanner message={error} />
            <Table columns={[{ label: 'Date' }, { label: 'Category' }, { label: 'Shop' }, { label: 'Reference' }, { label: 'Amount' }, { label: 'Note' }, { label: 'Action' }]} isLoading={isLoading} isEmpty={items.length === 0} emptyText="No expenses found.">
                {items.map((expense) => (
                    <tr key={expense.id} className="text-center">
                        <td className="whitespace-nowrap px-4 py-3">{expense.expense_date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{expense.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{expense.shop_name ?? '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{expense.reference_no || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{money(expense.amount)}</td>
                        <td className="px-4 py-3 text-left">{expense.note || '-'}</td>
                        <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                                {can('expenses.update') && <button onClick={() => setEditing(expense)} className={rowEditButton}><FiEdit2 className="h-3.5 w-3.5" /> Edit</button>}
                                {can('expenses.delete') && <button onClick={() => handleDelete(expense)} className={rowDeleteButton}><FiTrash2 className="h-3.5 w-3.5" /> Delete</button>}
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>
            {editing && (
                <Modal title={editing.id ? 'Edit Expense' : 'Add Expense'} onClose={() => setEditing(null)}>
                    <ExpenseForm expense={editing.id ? editing : null} shops={shops} isManager={isManager} onSaved={() => { setEditing(null); reload(); }} onCancel={() => setEditing(null)} />
                </Modal>
            )}
        </div>
    );
}
