import { useEffect, useState } from "react";
import { FiImage, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import CreatableSelect, { optionCode } from "./CreatableSelect";
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
    shops = [],
    onSaved,
    onCancel,
    onOptionCreated,
}) {
    const { user, can } = useAuth();
    const isManager = user?.role === "manager";
    const [form, setForm] = useState({
        name: product?.name ?? "",
        created_by_shop_id:
            product?.created_by_shop_id ?? (isManager ? user?.shop_id ?? "" : ""),
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
    const [isSkuAuto, setIsSkuAuto] = useState(!product);

    useEffect(() => {
        if (product || !isSkuAuto) return;
        api("/products/next-sku", {
            params: { shop_id: form.created_by_shop_id || undefined },
        })
            .then((response) =>
                setForm((current) => ({ ...current, sku: response.data.sku })),
            )
            .catch(() => {});
    }, [product, isSkuAuto, form.created_by_shop_id]);

    const toggleSkuMode = () => {
        if (isSkuAuto) {
            setIsSkuAuto(false);
            return;
        }

        setIsSkuAuto(true);
        setForm((current) => ({ ...current, sku: "" }));
    };

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

    const setValue = (key) => (value) =>
        setForm((current) => ({ ...current, [key]: value }));

    const availableShops = isManager
        ? shops.filter(
              (shop) => String(shop.id) === String(user?.shop_id),
          )
        : shops;

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
            created_by_shop_id:
                form.created_by_shop_id === ""
                    ? null
                    : Number(form.created_by_shop_id),
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
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="sku" className="text-sm font-medium">
                            SKU / Code
                        </label>
                        {!product && (
                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-normal text-slate-600">
                                <span className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isSkuAuto}
                                        onChange={toggleSkuMode}
                                    />
                                    <span className="block h-4 w-7 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/40" />
                                    <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform peer-checked:translate-x-3" />
                                </span>
                                <span>Auto Generate</span>
                            </label>
                        )}
                    </div>
                    <input
                        id="sku"
                        className={`${inputClass} font-mono ${!product && isSkuAuto ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""}`}
                        value={form.sku}
                        onChange={set("sku")}
                        placeholder={
                            !product && isSkuAuto
                                ? "Generated on save"
                                : "Enter SKU / Code"
                        }
                        readOnly={!product && isSkuAuto}
                        required={Boolean(product) || !isSkuAuto}
                        maxLength={15}
                    />
                    {first("sku") && (
                        <span className="mt-1 block text-xs font-normal text-red-600">
                            {first("sku")}
                        </span>
                    )}
                    <span
                        className={`mt-1 block text-xs font-normal ${form.sku.length >= 15 ? "text-amber-600" : "text-slate-400"}`}
                    >
                        {form.sku.length >= 15
                            ? "Maximum 15 characters reached."
                            : `Maximum 15 characters (${form.sku.length}/15).`}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Shop" error={first("created_by_shop_id")}>
                    <CreatableSelect
                        value={form.created_by_shop_id}
                        onChange={setValue("created_by_shop_id")}
                        options={availableShops}
                        endpoint="/shops"
                        canCreate={can("shops.create") && !isManager && !product}
                        createPayload={(name) => optionCode(name, "SHOP", 3)}
                        onCreated={(option) => onOptionCreated?.("shops", option)}
                        placeholder={
                            isManager && !user?.shop_id
                                ? "No shop assigned"
                                : "Select shop"
                        }
                        disabled={isManager || Boolean(product)}
                        required
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Category" error={first("category_id")}>
                    <CreatableSelect
                        value={form.category_id}
                        onChange={setValue("category_id")}
                        options={categories}
                        endpoint="/categories"
                        canCreate={can("categories.create")}
                        onCreated={(option) => onOptionCreated?.("categories", option)}
                        placeholder="Select category"
                    />
                </Field>
                <Field label="Brand" error={first("brand_id")}>
                    <CreatableSelect
                        value={form.brand_id}
                        onChange={setValue("brand_id")}
                        options={brands}
                        endpoint="/brands"
                        canCreate={can("brands.create")}
                        onCreated={(option) => onOptionCreated?.("brands", option)}
                        placeholder="Select brand"
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Supplier" error={first("supplier_id")}>
                    <CreatableSelect
                        value={form.supplier_id}
                        onChange={setValue("supplier_id")}
                        options={suppliers}
                        endpoint="/suppliers"
                        canCreate={can("suppliers.create")}
                        onCreated={(option) => onOptionCreated?.("suppliers", option)}
                        placeholder="Select supplier"
                    />
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
