import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Badge, ErrorBanner, Field, FormActions, PageHeader, inputClass, secondaryButton } from '../../components/ui';

const emptyForm = {
    brand_name: '',
    eyebrow: '',
    hero_title: '',
    hero_description: '',
    primary_cta_label: '',
    primary_cta_url: '/login',
    secondary_cta_label: '',
    features: [{ title: '', description: '' }],
    showcase_title: '',
    showcase_description: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    footer_text: '',
    is_published: true,
};

function Section({ title, description, children }) {
    return (
        <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

export default function LandingPage() {
    const { can } = useAuth();
    const canEdit = can('landing_page.update');
    const [form, setForm] = useState(emptyForm);
    const [original, setOriginal] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');
        try {
            const response = await api('/landing-page/settings');
            setForm(response.data);
            setOriginal(response.data);
        } catch (error) {
            setLoadError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const fieldClass = `${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`;
    const first = (key) => errors[key]?.[0];
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const setFeature = (index, key, value) => {
        setForm((current) => ({
            ...current,
            features: current.features.map((feature, featureIndex) => (
                featureIndex === index ? { ...feature, [key]: value } : feature
            )),
        }));
    };

    const addFeature = () => {
        if (form.features.length >= 6) return;
        setForm((current) => ({ ...current, features: [...current.features, { title: '', description: '' }] }));
    };

    const removeFeature = (index) => {
        if (form.features.length <= 1) return;
        setForm((current) => ({ ...current, features: current.features.filter((_, featureIndex) => featureIndex !== index) }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canEdit) return;

        setErrors({});
        setMessage('');
        setIsSaving(true);
        try {
            await api('/landing-page', {
                method: 'PUT',
                body: {
                    brand_name: form.brand_name,
                    eyebrow: form.eyebrow,
                    hero_title: form.hero_title,
                    hero_description: form.hero_description,
                    primary_cta_label: form.primary_cta_label,
                    primary_cta_url: form.primary_cta_url,
                    secondary_cta_label: form.secondary_cta_label,
                    features: form.features.map(({ title, description }) => ({ title, description })),
                    showcase_title: form.showcase_title,
                    showcase_description: form.showcase_description,
                    contact_email: form.contact_email,
                    contact_phone: form.contact_phone,
                    contact_address: form.contact_address,
                    footer_text: form.footer_text,
                    is_published: form.is_published,
                },
            });
            await load();
            setMessage('Landing page saved.');
        } catch (error) {
            setErrors(error.errors ?? {});
            setMessage(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Loading landing page settings…</div>;
    }

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <PageHeader title="Landing Page" subtitle="Edit the public website shown before staff sign in.">
                <Badge tone={form.is_published ? 'green' : 'amber'}>{form.is_published ? 'Published' : 'Unpublished'}</Badge>
                {!canEdit && <Badge>Read only</Badge>}
            </PageHeader>

            <ErrorBanner message={loadError || message} />

            <form onSubmit={handleSubmit} className="space-y-5">
                <Section title="Brand and hero" description="The first message visitors see when they open the website.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Brand name" error={first('brand_name')}>
                            <input value={form.brand_name ?? ''} onChange={(event) => set('brand_name', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                        <Field label="Eyebrow" error={first('eyebrow')}>
                            <input value={form.eyebrow ?? ''} onChange={(event) => set('eyebrow', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                    </div>
                    <Field label="Hero title" error={first('hero_title')}>
                        <input value={form.hero_title ?? ''} onChange={(event) => set('hero_title', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                    <Field label="Hero description" error={first('hero_description')}>
                        <textarea rows={3} value={form.hero_description ?? ''} onChange={(event) => set('hero_description', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                </Section>

                <Section title="Buttons" description="The primary link may be an absolute URL or a path beginning with / .">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Primary button label" error={first('primary_cta_label')}>
                            <input value={form.primary_cta_label ?? ''} onChange={(event) => set('primary_cta_label', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                        <Field label="Primary button URL" error={first('primary_cta_url')}>
                            <input value={form.primary_cta_url ?? ''} onChange={(event) => set('primary_cta_url', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                    </div>
                    <Field label="Secondary button label" error={first('secondary_cta_label')}>
                        <input value={form.secondary_cta_label ?? ''} onChange={(event) => set('secondary_cta_label', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                </Section>

                <Section title="Features" description="Up to six cards are shown in the features grid.">
                    <div className="space-y-3">
                        {(form.features ?? []).map((feature, index) => (
                            <div key={index} className="rounded-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">Feature {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        disabled={!canEdit || form.features.length <= 1}
                                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <FiTrash2 className="h-3.5 w-3.5" /> Remove
                                    </button>
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <Field label="Title" error={first(`features.${index}.title`)}>
                                        <input value={feature.title ?? ''} onChange={(event) => setFeature(index, 'title', event.target.value)} disabled={!canEdit} className={fieldClass} />
                                    </Field>
                                    <Field label="Description" error={first(`features.${index}.description`)}>
                                        <input value={feature.description ?? ''} onChange={(event) => setFeature(index, 'description', event.target.value)} disabled={!canEdit} className={fieldClass} />
                                    </Field>
                                </div>
                            </div>
                        ))}
                    </div>
                    {canEdit && (
                        <button type="button" onClick={addFeature} disabled={form.features.length >= 6} className={secondaryButton}>
                            <FiPlus className="h-4 w-4" /> Add feature
                        </button>
                    )}
                </Section>

                <Section title="About section" description="Supporting copy shown beside the dashboard preview.">
                    <Field label="Section title" error={first('showcase_title')}>
                        <input value={form.showcase_title ?? ''} onChange={(event) => set('showcase_title', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                    <Field label="Section description" error={first('showcase_description')}>
                        <textarea rows={3} value={form.showcase_description ?? ''} onChange={(event) => set('showcase_description', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                </Section>

                <Section title="Footer and visibility" description="Contact details and whether the public page is live.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Contact email" error={first('contact_email')}>
                            <input type="email" value={form.contact_email ?? ''} onChange={(event) => set('contact_email', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                        <Field label="Contact phone" error={first('contact_phone')}>
                            <input value={form.contact_phone ?? ''} onChange={(event) => set('contact_phone', event.target.value)} disabled={!canEdit} className={fieldClass} />
                        </Field>
                    </div>
                    <Field label="Contact address" error={first('contact_address')}>
                        <input value={form.contact_address ?? ''} onChange={(event) => set('contact_address', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                    <Field label="Footer text" error={first('footer_text')}>
                        <input value={form.footer_text ?? ''} onChange={(event) => set('footer_text', event.target.value)} disabled={!canEdit} className={fieldClass} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={Boolean(form.is_published)}
                            onChange={(event) => set('is_published', event.target.checked)}
                            disabled={!canEdit}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        Published
                    </label>
                </Section>

                {canEdit && (
                    <FormActions
                        isSaving={isSaving}
                        onCancel={() => {
                            if (original) setForm(original);
                            setErrors({});
                            setMessage('');
                        }}
                    />
                )}
            </form>
        </div>
    );
}
