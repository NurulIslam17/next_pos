import { useEffect, useMemo, useState } from "react";
import { FiLock, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { api } from "../api";
import { useAuth } from "../auth";
import {
    ErrorBanner,
    Field,
    inputClass,
    primaryButton,
    secondaryButton,
    useSubmit,
} from "./ui";

const makeKey = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

function calculate(item) {
    const base = round2(
        (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
    );
    const discount = round2(Math.min(Number(item.discount) || 0, base));
    const vat = round2(
        (base - discount) * ((Number(item.vat_rate) || 0) / 100),
    );

    return { base, discount, vat, total: round2(base - discount + vat) };
}

export default function PurchaseForm({ onSaved, onCancel }) {
    const { user } = useAuth();
    const isManager = user?.role === "manager";
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        purchase_no: "",
        purchase_date: today,
        supplier_id: "",
        shop_id: isManager ? String(user.shop_id ?? "") : "",
        payment_type_id: "",
        reference_no: "",
        note: "",
        paid_amount: "",
    });
    const [items, setItems] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [shops, setShops] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [productError, setProductError] = useState("");
    const { message, isSaving, submit, first } = useSubmit();

    useEffect(() => {
        Promise.all([api("/suppliers"), api("/shops"), api("/payment-types")])
            .then(([supplierResponse, shopResponse, paymentTypeResponse]) => {
                setSuppliers(supplierResponse.data);
                setShops(shopResponse.data);
                setPaymentTypes(paymentTypeResponse.data);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        api("/purchases/next-number", {
            params: { shop_id: form.shop_id || undefined },
        })
            .then((response) =>
                setForm((current) => ({
                    ...current,
                    purchase_no: response.data.purchase_no,
                })),
            )
            .catch(() => {});
    }, [form.shop_id]);

    useEffect(() => {
        if (!form.shop_id) {
            setAvailableProducts([]);
            return undefined;
        }

        setProductError("");
        api("/products/all", { params: { shop_id: form.shop_id } })
            .then((response) => setAvailableProducts(response.data))
            .catch((e) => {
                setAvailableProducts([]);
                setProductError(e.message);
            });

        return undefined;
    }, [form.shop_id]);

    const totals = useMemo(() => {
        const rows = items.map(calculate);
        const subtotal = round2(rows.reduce((sum, row) => sum + row.base, 0));
        const discount = round2(
            rows.reduce((sum, row) => sum + row.discount, 0),
        );
        const vat = round2(rows.reduce((sum, row) => sum + row.vat, 0));
        const total = round2(subtotal - discount + vat);
        const paid = Number(form.paid_amount) || 0;
        return {
            subtotal,
            discount,
            vat,
            total,
            paid,
            due: round2(Math.max(total - paid, 0)),
        };
    }, [items, form.paid_amount]);

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) {
            return availableProducts;
        }

        return availableProducts.filter(
            (product) =>
                product.sku.toLowerCase().includes(term) ||
                product.name.toLowerCase().includes(term),
        );
    }, [availableProducts, productSearch]);

    const setField = (key, value) =>
        setForm((current) => ({ ...current, [key]: value }));
    const updateItem = (key, changes) =>
        setItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, ...changes } : item,
            ),
        );

    const addProduct = (product) => {
        if (items.some((item) => item.product_id === product.id)) {
            return;
        }

        setItems((current) => [
            ...current,
            {
                key: makeKey(),
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                stock: product.stock ?? 0,
                quantity: 1,
                unit_cost: product.price ?? 0,
                vat_rate: product.vat ?? 0,
                discount: 0,
            },
        ]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (items.length === 0) {
            return;
        }

        submit(async () => {
            await api("/purchases", {
                method: "POST",
                body: {
                    ...form,
                    supplier_id: form.supplier_id || null,
                    shop_id: form.shop_id || null,
                    payment_type_id: form.payment_type_id || null,
                    paid_amount: Number(form.paid_amount) || 0,
                    items: items.map(({ key: _key, ...item }) => ({
                        ...item,
                        quantity: Number(item.quantity),
                        unit_cost: Number(item.unit_cost),
                        vat_rate: Number(item.vat_rate),
                        discount: Number(item.discount),
                    })),
                },
            });
            onSaved();
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="mb-4 text-base font-semibold">
                    Purchase Information
                </h2>
                <p className="mb-4 rounded-md italic bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    এটি একটি অপেক্ষমাণ ক্রয় আদেশ (Purchase Order) হিসেবে
                    সংরক্ষিত হবে। সুপার অ্যাডমিনের অনুমোদন সম্পন্ন হওয়ার পর
                    স্টকের পরিমাণ হালনাগাদ(Update) করা হবে।
                </p>
                <ErrorBanner message={message} />
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Purchase No">
                        <input
                            value={form.purchase_no}
                            readOnly
                            className={`${inputClass} bg-slate-50`}
                        />
                    </Field>
                    <Field label="Purchase Date" error={first("purchase_date")}>
                        <input
                            type="date"
                            value={form.purchase_date}
                            onChange={(event) =>
                                setField("purchase_date", event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Supplier" error={first("supplier_id")}>
                        <select
                            value={form.supplier_id}
                            onChange={(event) =>
                                setField("supplier_id", event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Select supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Shop" error={first("shop_id")}>
                        <select
                            value={form.shop_id}
                            disabled={isManager}
                            onChange={(event) => {
                                setField("shop_id", event.target.value);
                                setItems([]);
                                setProductSearch("");
                            }}
                            className={`${inputClass} disabled:bg-slate-50`}
                        >
                            <option value="">
                                {isManager
                                    ? user.shop_id
                                        ? "Assigned shop"
                                        : "No shop assigned"
                                    : "Select shop"}
                            </option>
                            {(isManager
                                ? shops.filter(
                                      (shop) =>
                                          String(shop.id) ===
                                          String(user.shop_id),
                                  )
                                : shops
                            ).map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Payment Type"
                        error={first("payment_type_id")}
                    >
                        <select
                            value={form.payment_type_id}
                            onChange={(event) =>
                                setField("payment_type_id", event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Select payment type</option>
                            {paymentTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Reference No" error={first("reference_no")}>
                        <input
                            value={form.reference_no}
                            onChange={(event) =>
                                setField("reference_no", event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Paid Amount" error={first("paid_amount")}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.paid_amount}
                            onChange={(event) =>
                                setField("paid_amount", event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Note" error={first("note")}>
                        <input
                            value={form.note}
                            onChange={(event) =>
                                setField("note", event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                </div>
            </div>

            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold">
                            Purchased Products
                        </h2>
                        <p className="text-sm text-slate-500">
                            Select from the shop product list. Unit cost is
                            filled from the selling price.
                        </p>
                    </div>
                    <ErrorBanner message={first("items")} />
                </div>
                <ErrorBanner message={productError} />

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="bg-slate-100 p-3 rounded-lg">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold">Product</h3>
                            <div className="relative w-full sm:w-64">
                                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={productSearch}
                                    onChange={(event) =>
                                        setProductSearch(event.target.value)
                                    }
                                    placeholder="Search code or name…"
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                        </div>
                        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                            {!form.shop_id ? (
                                <p className="px-3 py-6 text-center text-sm text-slate-500">
                                    Select a shop to load its products.
                                </p>
                            ) : filteredProducts.length === 0 ? (
                                <p className="px-3 py-6 text-center text-sm text-slate-500">
                                    {productSearch
                                        ? "No products match your search."
                                        : "No products found for this shop."}
                                </p>
                            ) : (
                                filteredProducts.map((product) => {
                                    const added = items.some(
                                        (item) =>
                                            item.product_id === product.id,
                                    );
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                        {product.sku}
                                                    </span>
                                                    <span className="truncate text-sm font-medium">
                                                        {product.name}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    Stock: {product.stock} ·
                                                    Unit cost:{" "}
                                                    {Number(
                                                        product.price ?? 0,
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={added}
                                                onClick={() =>
                                                    addProduct(product)
                                                }
                                                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <FiPlus className="h-3.5 w-3.5" />{" "}
                                                {added ? "Added" : "Add"}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Purchased Products
                            </h3>
                            <span className="text-xs text-slate-500">
                                {items.length} selected
                            </span>
                        </div>
                        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                            {items.length === 0 && (
                                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-400">
                                    Add products from the product list.
                                </p>
                            )}
                            {items.map((item) => {
                                const row = calculate(item);
                                const isLocked = Number(item.stock) > 0;
                                const disabledInputClass = `${inputClass} disabled:bg-slate-50 disabled:text-slate-500`;
                                return (
                                    <div
                                        key={item.key}
                                        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:flex-nowrap"
                                    >
                                        <div className="min-w-[160px] flex-1">
                                            <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                                                <span className="truncate">
                                                    {item.product_name}
                                                </span>
                                                {isLocked && (
                                                    <FiLock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {item.product_sku} · Stock:{" "}
                                                {item.stock}
                                            </div>
                                        </div>
                                        <label className="w-20 shrink-0 text-xs font-medium text-slate-500">
                                            Qty
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                disabled={isLocked}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        quantity:
                                                            event.target.value,
                                                    })
                                                }
                                                className={disabledInputClass}
                                            />
                                        </label>
                                        <label className="w-28 shrink-0 text-xs font-medium text-slate-500">
                                            Unit Cost
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_cost}
                                                disabled={isLocked}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        unit_cost:
                                                            event.target.value,
                                                    })
                                                }
                                                className={disabledInputClass}
                                            />
                                        </label>
                                        <label className="w-20 shrink-0 text-xs font-medium text-slate-500">
                                            VAT %
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.vat_rate}
                                                disabled={isLocked}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        vat_rate:
                                                            event.target.value,
                                                    })
                                                }
                                                className={disabledInputClass}
                                            />
                                        </label>
                                        <label className="w-28 shrink-0 text-xs font-medium text-slate-500">
                                            Discount
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.discount}
                                                disabled={isLocked}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        discount:
                                                            event.target.value,
                                                    })
                                                }
                                                className={disabledInputClass}
                                            />
                                        </label>
                                        <div className="w-24 shrink-0 text-right">
                                            <div className="text-xs text-slate-500">
                                                Line Total
                                            </div>
                                            <div className="font-semibold">
                                                {row.total.toFixed(2)}
                                            </div>
                                        </div>
                                        {!isLocked && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setItems((current) =>
                                                        current.filter(
                                                            (rowItem) =>
                                                                rowItem.key !==
                                                                item.key,
                                                        ),
                                                    )
                                                }
                                                className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50"
                                                aria-label="Remove product"
                                            >
                                                <FiTrash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col items-end gap-1 border-t pt-4 text-sm">
                    <div className="w-64 flex justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span>{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between">
                        <span className="text-slate-500">Discount</span>
                        <span>-{totals.discount.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between">
                        <span className="text-slate-500">VAT</span>
                        <span>{totals.vat.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between text-base font-semibold">
                        <span>Grand Total</span>
                        <span>{totals.total.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between text-emerald-700">
                        <span>Paid</span>
                        <span>{totals.paid.toFixed(2)}</span>
                    </div>
                    <div className="w-64 flex justify-between text-amber-700">
                        <span>Due</span>
                        <span>{totals.due.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={secondaryButton}
                >
                    Back to list
                </button>
                <button
                    type="submit"
                    disabled={isSaving || items.length === 0}
                    className={primaryButton}
                >
                    {isSaving ? "Saving…" : "Create Purchase Order"}
                </button>
            </div>
        </form>
    );
}
