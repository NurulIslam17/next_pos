import { useState } from 'react';
import { api } from '../api';
import { ErrorBanner, Field, FormActions, inputClass, useSubmit } from './ui';

export default function ChangePasswordForm({ onSaved, onCancel }) {
    const [form, setForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [saved, setSaved] = useState(false);
    const { first, message, isSaving, submit } = useSubmit();

    const set = (key) => (event) => {
        setSaved(false);
        setForm({ ...form, [key]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const ok = await submit(async () => {
            await api('/profile/change-password', { method: 'POST', body: form });
            setForm({ current_password: '', password: '', password_confirmation: '' });
            setSaved(true);
            onSaved?.();
        });

        if (!ok) setSaved(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner message={message} />
            {saved && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password changed successfully.</div>}

            <Field label="Current password" error={first('current_password')}>
                <input type="password" autoComplete="current-password" className={inputClass} value={form.current_password} onChange={set('current_password')} required />
            </Field>
            <Field label="New password" error={first('password')}>
                <input type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={set('password')} minLength={8} required />
            </Field>
            <Field label="Confirm new password">
                <input type="password" autoComplete="new-password" className={inputClass} value={form.password_confirmation} onChange={set('password_confirmation')} minLength={8} required />
            </Field>

            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}
