import { useEffect, useState } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { api, ApiError } from '../api';
import { primaryButton, secondaryButton } from './ui';

const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {children}
            {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
        </label>
    );
}

export default function ProductForm({ product, categories, brands, suppliers, onSaved, onCancel }) {
    const [form, setForm] = useState({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        category_id: product?.category_id ?? '',
        brand_id: product?.brand_id ?? '',
        supplier_id: product?.supplier_id ?? '',
        cost_price: product?.cost_price ?? '',
        price: product?.price ?? '',
        stock: product?.stock ?? 0,
        stock_alert: product?.stock_alert ?? 0,
        vat: product?.vat ?? 0,
        vat_type: product?.vat_type ?? 'included',
        note: product?.note ?? '',
        is_active: product?.is_active ?? true,
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // New products get an auto-generated code (shop code + date/time + running number).
    useEffect(() => {
        if (product) return;
        api('/products/next-sku')
            .then((response) => setForm((current) => ({ ...current, sku: response.data.sku })))
            .catch(() => {});
    }, [product]);

    const set = (key) => (event) =>
        setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setErrors({});
        setMessage('');

        const body = {
            ...form,
            category_id: form.category_id === '' ? null : Number(form.category_id),
            brand_id: form.brand_id === '' ? null : Number(form.brand_id),
            supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
            cost_price: form.cost_price === '' ? 0 : form.cost_price,
            price: form.price === '' ? 0 : form.price,
            stock: form.stock === '' ? 0 : form.stock,
            stock_alert: form.stock_alert === '' ? 0 : form.stock_alert,
            vat: form.vat === '' ? 0 : form.vat,
        };

        try {
            await api(product ? `/products/${product.id}` : '/products', {
                method: product ? 'PUT' : 'POST',
                body,
            });
            onSaved();
        } catch (e) {
            if (e instanceof ApiError) {
                setErrors(e.errors);
                setMessage(e.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const first = (key) => errors[key]?.[0];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}

            <Field label="Name" error={first('name')}>
                <input className={inputClass} value={form.name} onChange={set('name')} required />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="SKU / Code" error={first('sku')}>
                    {product ? (
                        <input className={inputClass} value={form.sku} onChange={set('sku')} required />
                    ) : (
                        <input
                            className={`${inputClass} cursor-not-allowed bg-slate-50 font-mono text-slate-600`}
                            value={form.sku}
                            placeholder="Generated on save"
                            readOnly
                        />
                    )}
                </Field>
                <Field label="Category" error={first('category_id')}>
                    <select className={inputClass} value={form.category_id} onChange={set('category_id')}>
                        <option value="">— None —</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Brand" error={first('brand_id')}>
                    <select className={inputClass} value={form.brand_id} onChange={set('brand_id')}>
                        <option value="">— None —</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Supplier" error={first('supplier_id')}>
                    <select className={inputClass} value={form.supplier_id} onChange={set('supplier_id')}>
                        <option value="">— None —</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Cost price" error={first('cost_price')}>
                    <input type="number" step="0.01" min="0" className={inputClass} value={form.cost_price} onChange={set('cost_price')} />
                </Field>
                <Field label="Selling price" error={first('price')}>
                    <input type="number" step="0.01" min="0" className={inputClass} value={form.price} onChange={set('price')} required />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Stock" error={first('stock')}>
                    <input type="number" min="0" className={inputClass} value={form.stock} onChange={set('stock')} />
                </Field>
                <Field label="Stock alert" error={first('stock_alert')}>
                    <input type="number" min="0" className={inputClass} value={form.stock_alert} onChange={set('stock_alert')} />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="VAT (%)" error={first('vat')}>
                    <input type="number" step="0.01" min="0" max="100" className={inputClass} value={form.vat} onChange={set('vat')} />
                </Field>
                <Field label="VAT type" error={first('vat_type')}>
                    <select className={inputClass} value={form.vat_type} onChange={set('vat_type')}>
                        <option value="included">Included</option>
                        <option value="excluded">Excluded</option>
                    </select>
                </Field>
            </div>

            <Field label="Note" error={first('note')}>
                <textarea rows={3} className={inputClass} value={form.note} onChange={set('note')} />
            </Field>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                Active
            </label>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className={secondaryButton}>
                    <FiX className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={isSaving} className={primaryButton}>
                    <FiSave className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
