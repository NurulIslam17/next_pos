import { useEffect, useState } from "react";
import { FiImage, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { api, ApiError } from "../api";
import { primaryButton, secondaryButton } from "./ui";

const inputClass =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const fileInputClass =
    "mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100";

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {children}
            {error && (
                <span className="mt-1 block text-xs font-normal text-red-600">
                    {error}
                </span>
            )}
        </label>
    );
}

export default function ProductForm({
    product,
    categories,
    brands,
    suppliers,
    onSaved,
    onCancel,
}) {
    const [form, setForm] = useState({
        name: product?.name ?? "",
        sku: product?.sku ?? "",
        category_id: product?.category_id ?? "",
        brand_id: product?.brand_id ?? "",
        supplier_id: product?.supplier_id ?? "",
        cost_price: product?.cost_price ?? "",
        price: product?.price ?? "",
        stock_alert: product?.stock_alert ?? 0,
        vat: product?.vat ?? 0,
        vat_type: "included",
        note: product?.note ?? "",
        is_active: product?.is_active ?? true,
    });
    const [existingImages, setExistingImages] = useState(product?.images ?? []);
    const [newImages, setNewImages] = useState([]);
    const [removedImageIds, setRemovedImageIds] = useState([]);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (product) return;
        api("/products/next-sku")
            .then((response) =>
                setForm((current) => ({ ...current, sku: response.data.sku })),
            )
            .catch(() => {});
    }, [product]);

    useEffect(
        () => () => newImages.forEach(({ url }) => URL.revokeObjectURL(url)),
        [newImages],
    );

    const set = (key) => (event) =>
        setForm({
            ...form,
            [key]:
                event.target.type === "checkbox"
                    ? event.target.checked
                    : event.target.value,
        });

    const handleFiles = (event) => {
        const files = Array.from(event.target.files ?? []);
        const usedSlots =
            existingImages.length - removedImageIds.length + newImages.length;
        const slots = Math.max(0, 10 - usedSlots);

        if (files.length > slots) {
            setErrors((current) => ({
                ...current,
                images: ["A product can have at most 10 photos."],
            }));
            event.target.value = "";
            return;
        }

        setNewImages((current) => [
            ...current,
            ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ]);
        event.target.value = "";
    };

    const removeNewImage = (index) => {
        setNewImages((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const removeExistingImage = (id) => {
        setRemovedImageIds((current) => [...current, id]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setErrors({});
        setMessage("");

        const body = {
            ...form,
            category_id:
                form.category_id === "" ? null : Number(form.category_id),
            brand_id: form.brand_id === "" ? null : Number(form.brand_id),
            supplier_id:
                form.supplier_id === "" ? null : Number(form.supplier_id),
            cost_price: form.cost_price === "" ? 0 : form.cost_price,
            price: form.price === "" ? 0 : form.price,
            stock: product?.stock ?? 0,
            stock_alert: form.stock_alert === "" ? 0 : form.stock_alert,
            vat: form.vat === "" ? 0 : form.vat,
        };

        const formData = new FormData();
        if (product) {
            formData.append("_method", "PUT");
        }
        Object.entries(body).forEach(([key, value]) => {
            formData.append(
                key,
                value === null || value === undefined
                    ? ""
                    : typeof value === "boolean"
                      ? value
                          ? "1"
                          : "0"
                      : String(value),
            );
        });
        newImages.forEach(({ file }) => formData.append("images[]", file));
        removedImageIds.forEach((id) =>
            formData.append("removed_image_ids[]", id),
        );

        try {
            const response = await api(
                product ? `/products/${product.id}` : "/products",
                {
                    method: "POST",
                    body: formData,
                },
            );
            setExistingImages(response.data?.images ?? []);
            setNewImages([]);
            setRemovedImageIds([]);
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
            {message && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Field label="Name" error={first("name")}>
                    <input
                        className={inputClass}
                        value={form.name}
                        onChange={set("name")}
                        required
                    />
                </Field>
                <Field label="SKU / Code" error={first("sku")}>
                    {product ? (
                        <input
                            className={inputClass}
                            value={form.sku}
                            onChange={set("sku")}
                            required
                        />
                    ) : (
                        <input
                            className={`${inputClass} cursor-not-allowed bg-slate-50 font-mono text-slate-600`}
                            value={form.sku}
                            placeholder="Generated on save"
                            readOnly
                        />
                    )}
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Category" error={first("category_id")}>
                    <select
                        className={inputClass}
                        value={form.category_id}
                        onChange={set("category_id")}
                    >
                        <option value="">— None —</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Brand" error={first("brand_id")}>
                    <select
                        className={inputClass}
                        value={form.brand_id}
                        onChange={set("brand_id")}
                    >
                        <option value="">— None —</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Supplier" error={first("supplier_id")}>
                    <select
                        className={inputClass}
                        value={form.supplier_id}
                        onChange={set("supplier_id")}
                    >
                        <option value="">— None —</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Cost price" error={first("cost_price")}>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputClass}
                        value={form.cost_price}
                        onChange={set("cost_price")}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Selling price" error={first("price")}>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputClass}
                        value={form.price}
                        onChange={set("price")}
                        required
                    />
                </Field>

                <Field label="Stock alert" error={first("stock_alert")}>
                    <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={form.stock_alert}
                        onChange={set("stock_alert")}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="VAT (%)" error={first("vat")}>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={inputClass}
                        value={form.vat}
                        onChange={set("vat")}
                    />
                </Field>
                <Field label="VAT type" error={first("vat_type")}>
                    <select
                        className={`${inputClass} cursor-not-allowed bg-slate-50`}
                        value="included"
                        disabled
                    >
                        <option value="included">Included</option>
                    </select>
                </Field>
            </div>

            <Field label="Note" error={first("note")}>
                <textarea
                    rows={3}
                    className={inputClass}
                    value={form.note}
                    onChange={set("note")}
                />
            </Field>

            <Field
                label="Photos (up to 10)"
                error={first("images") || first("removed_image_ids")}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFiles}
                    className={fileInputClass}
                />
                {existingImages.some(
                    (image) => !removedImageIds.includes(image.id),
                ) || newImages.length ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                        {existingImages
                            .filter(
                                (image) => !removedImageIds.includes(image.id),
                            )
                            .map((image) => (
                                <div
                                    key={image.id}
                                    className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-slate-200"
                                >
                                    <img
                                        src={image.url}
                                        alt={image.original_name}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeExistingImage(image.id)
                                        }
                                        title="Remove photo"
                                        className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 hover:bg-white"
                                    >
                                        <FiX className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        {newImages.map(({ file, url }, index) => (
                            <div
                                key={url}
                                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200"
                            >
                                <img
                                    src={url}
                                    alt={file.name}
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeNewImage(index)}
                                    title="Remove photo"
                                    className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 hover:bg-white"
                                >
                                    <FiX className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <FiImage className="h-4 w-4" /> No photos added.
                    </p>
                )}
            </Field>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={set("is_active")}
                />
                Active
            </label>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={secondaryButton}
                >
                    <FiX className="h-4 w-4" /> Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className={primaryButton}
                >
                    <FiSave
                        className={`h-4 w-4 ${isSaving ? "animate-pulse" : ""}`}
                    />{" "}
                    {isSaving ? "Saving…" : "Save"}
                </button>
            </div>
        </form>
    );
}
