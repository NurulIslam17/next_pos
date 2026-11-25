import { useEffect, useMemo, useState } from "react";
import {
    FiAlertTriangle,
    FiPlus,
    FiPrinter,
    FiSave,
    FiSearch,
    FiTrash2,
} from "react-icons/fi";
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

const isLowStock = (product) => {
    const alert = Number(product.stock_alert) || 0;
    const stock = Number(product.stock) || 0;

    return alert > 0 && stock > 0 && stock <= alert;
};

function CustomerPicker({
    customers,
    value,
    error,
    canCreate,
    onSelect,
    onCreated,
}) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const selectedCustomer = customers.find(
        (customer) => String(customer.id) === String(value),
    );
    const normalizedQuery = query.trim().toLowerCase();
    const matches = customers
        .filter((customer) => {
            if (!normalizedQuery) {
                return true;
            }

            return (
                String(customer.name ?? "")
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                String(customer.phone ?? "").includes(normalizedQuery)
            );
        })
        .slice(0, 8);
    const hasExactName = customers.some(
        (customer) =>
            String(customer.name ?? "")
                .trim()
                .toLowerCase() === query.trim().toLowerCase(),
    );
    const canCreateFromQuery =
        canCreate && query.trim().length > 0 && !hasExactName;

    const choose = (customer) => {
        onSelect(customer ? String(customer.id) : "");
        setQuery(customer?.name ?? "");
        setIsOpen(false);
        setCreateError("");
    };

    const createCustomer = async () => {
        const name = query.trim();
        if (!name) {
            return;
        }

        setIsCreating(true);
        setCreateError("");
        try {
            const response = await api("/customers", {
                method: "POST",
                body: { name },
            });
            onCreated(response.data);
            choose(response.data);
        } catch (e) {
            setCreateError(e.message);
            setIsOpen(true);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setIsOpen(false);
            return;
        }

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        if (matches.length > 0) {
            choose(matches[0]);
            return;
        }

        if (canCreateFromQuery) {
            createCustomer();
        }
    };

    const keepFocus = (event) => event.preventDefault();

    return (
        <div className="relative">
            <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={isOpen ? query : (selectedCustomer?.name ?? query)}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setCreateError("");
                        setIsOpen(true);
                        if (
                            selectedCustomer &&
                            event.target.value !== selectedCustomer.name
                        ) {
                            onSelect("");
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        setIsOpen(false);
                        if (!selectedCustomer) {
                            setQuery("");
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search or create customer…"
                    autoComplete="off"
                    className={`${inputClass} pl-9`}
                />
            </div>
            {isOpen && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-slate-200">
                    <button
                        type="button"
                        onMouseDown={keepFocus}
                        onClick={() => choose(null)}
                        className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Walk-in Customer
                    </button>
                    {matches.map((customer) => (
                        <button
                            key={customer.id}
                            type="button"
                            onMouseDown={keepFocus}
                            onClick={() => choose(customer)}
                            className="block w-full px-3 py-2 text-left text-xs hover:bg-indigo-50"
                        >
                            <span className="font-medium text-slate-800">
                                {customer.name}
                            </span>
                            {customer.phone ? (
                                <span className="ml-2 text-slate-500">
                                    {customer.phone}
                                </span>
                            ) : null}
                        </button>
                    ))}
                    {matches.length === 0 && !canCreateFromQuery && (
                        <p className="px-3 py-2 text-xs text-slate-500">
                            No customers found.
                        </p>
                    )}
                    {canCreateFromQuery && (
                        <button
                            type="button"
                            onMouseDown={keepFocus}
                            onClick={createCustomer}
                            disabled={isCreating}
                            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                        >
                            <FiPlus className="h-3.5 w-3.5" />
                            {isCreating
                                ? "Creating…"
                                : `Create “${query.trim()}”`}
                        </button>
                    )}
                </div>
            )}
            {createError ? (
                <p className="mt-1 text-xs text-red-600">{createError}</p>
            ) : null}
            {error ? (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : null}
        </div>
    );
}

function calculate(item) {
    const base = round2(
        (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    );
    const discount = round2(Math.min(Number(item.discount) || 0, base));
    const net = round2(base - discount);
    const rate = Number(item.vat_rate) || 0;
    const vat = round2(net - net / (1 + rate / 100));
    return { base, discount, vat, total: net };
}

const escapeHtml = (value) =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );

const receiptMoney = (value) => Number(value ?? 0).toFixed(2);

function writeReceipt(printWindow, sale) {
    const itemRows = (sale.items ?? [])
        .map(
            (item) => `
        <tr>
            <td>${escapeHtml(item.product_name)}</td>
            <td class="center">${escapeHtml(item.quantity)}</td>
            <td class="right">${receiptMoney(item.unit_price)}</td>
            <td class="right">${receiptMoney(item.line_total)}</td>
        </tr>
    `,
        )
        .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
    <title>Invoice ${escapeHtml(sale.sale_no)}</title>
    <style>
        @page { size: 80mm auto; margin: 2mm; }
        * { box-sizing: border-box; }
        body { width: 76mm; margin: 0 auto; font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 14px; margin: 0 0 2px; text-align: center; }
        p { margin: 1px 0; }
        .muted { color: #555; }
        .center { text-align: center; }
        .right { text-align: right; }
        .line { border-top: 1px dashed #333; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 0; vertical-align: top; }
        th { text-align: left; font-size: 10px; border-bottom: 1px dashed #333; }
        .totals div { display: flex; justify-content: space-between; padding: 1px 0; }
        .grand { font-weight: bold; border-top: 1px dashed #333; margin-top: 2px; padding-top: 2px; }
        .footer { margin-top: 6px; text-align: center; font-size: 10px; }
        @media print { body { width: auto; margin: 0; } }
    </style>
</head>
<body>
    <h1>${escapeHtml(sale.shop_name ?? "INVOICE")}</h1>
    <p class="center muted">Sales Invoice</p>
    <div class="line"></div>
    <p>Invoice: ${escapeHtml(sale.sale_no)}</p>
    <p>Date: ${escapeHtml(sale.sale_date)}</p>
    <p>Customer: ${escapeHtml(sale.customer_name ?? "Walk-in Customer")}</p>
    <p>Payment: ${escapeHtml(sale.payment_type_name ?? "-")}</p>
    ${sale.reference_no ? `<p>Ref: ${escapeHtml(sale.reference_no)}</p>` : ""}
    <div class="line"></div>
    <table>
        <thead><tr><th>Item</th><th class="center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
    </table>
    <div class="line"></div>
    <div class="totals">
        <div><span>Subtotal</span><span>${receiptMoney(sale.subtotal)}</span></div>
        <div><span>Discount</span><span>-${receiptMoney(sale.discount)}</span></div>
        <div><span>VAT (Included)</span><span>${receiptMoney(sale.vat)}</span></div>
        <div class="grand"><span>Grand Total</span><span>${receiptMoney(sale.total)}</span></div>
        <div><span>Paid</span><span>${receiptMoney(sale.paid_amount)}</span></div>
        <div><span>Due</span><span>${receiptMoney(sale.due_amount)}</span></div>
    </div>
    <p class="footer">Thank you for your purchase.</p>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
}

export default function SaleForm({ onSaved, onCancel }) {
    const { user, can } = useAuth();
    const isManager = user?.role === "manager";
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        sale_no: "",
        sale_date: today,
        customer_id: "",
        shop_id: isManager ? String(user.shop_id ?? "") : "",
        payment_type_id: "",
        reference_no: "",
        note: "",
        paid_amount: "",
    });
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [shops, setShops] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [productError, setProductError] = useState("");
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const { message, isSaving, submit, first } = useSubmit();

    useEffect(() => {
        Promise.all([
            api("/customers/all"),
            api("/shops"),
            api("/payment-types"),
        ])
            .then(([customerResponse, shopResponse, paymentTypeResponse]) => {
                setCustomers(customerResponse.data);
                setShops(shopResponse.data);
                setPaymentTypes(paymentTypeResponse.data);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        api("/sales/next-number", {
            params: { shop_id: form.shop_id || undefined },
        })
            .then((response) =>
                setForm((current) => ({
                    ...current,
                    sale_no: response.data.sale_no,
                })),
            )
            .catch(() => {});
    }, [form.shop_id]);

    useEffect(() => {
        if (!form.shop_id) {
            setAvailableProducts([]);
            setIsLoadingProducts(false);
            return;
        }

        let active = true;
        setProductError("");
        setIsLoadingProducts(true);
        api("/products/all", { params: { shop_id: form.shop_id } })
            .then((response) => {
                if (active) {
                    setAvailableProducts(response.data);
                }
            })
            .catch((error) => {
                if (active) {
                    setAvailableProducts([]);
                    setProductError(error.message);
                }
            })
            .finally(() => {
                if (active) {
                    setIsLoadingProducts(false);
                }
            });

        return () => {
            active = false;
        };
    }, [form.shop_id]);

    const totals = useMemo(() => {
        const rows = items.map(calculate);
        const subtotal = round2(rows.reduce((sum, row) => sum + row.base, 0));
        const discount = round2(
            rows.reduce((sum, row) => sum + row.discount, 0),
        );
        const vat = round2(rows.reduce((sum, row) => sum + row.vat, 0));
        const total = round2(subtotal - discount);
        return { subtotal, discount, vat, total, paid: total, due: 0 };
    }, [items]);

    useEffect(() => {
        const paidAmount = totals.total.toFixed(2);
        setForm((current) =>
            current.paid_amount === paidAmount
                ? current
                : { ...current, paid_amount: paidAmount },
        );
    }, [totals.total]);

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) {
            return availableProducts;
        }
        return availableProducts.filter(
            (product) =>
                String(product.sku ?? "")
                    .toLowerCase()
                    .includes(term) ||
                String(product.name ?? "")
                    .toLowerCase()
                    .includes(term),
        );
    }, [availableProducts, productSearch]);

    const hasStockError = items.some(
        (item) => Number(item.quantity) > Number(item.stock),
    );
    const cannotSave = isSaving || items.length === 0 || hasStockError;

    const setField = (key, value) =>
        setForm((current) => ({ ...current, [key]: value }));

    const updateItem = (key, changes) =>
        setItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, ...changes } : item,
            ),
        );

    const addProduct = (product) => {
        if (
            items.some((item) => item.product_id === product.id) ||
            Number(product.stock) <= 0
        ) {
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
                stock_alert: product.stock_alert ?? 0,
                quantity: 1,
                unit_price: product.price ?? 0,
                vat_rate: product.vat ?? 0,
                discount: 0,
            },
        ]);
    };

    const saveSale = async (shouldPrint) => {
        const receiptWindow = shouldPrint
            ? window.open("", "_blank", "width=420,height=720")
            : null;
        let response;

        try {
            response = await api("/sales", {
                method: "POST",
                body: {
                    ...form,
                    customer_id: form.customer_id || null,
                    shop_id: form.shop_id || null,
                    payment_type_id: form.payment_type_id || null,
                    paid_amount: totals.total,
                    items: items.map(
                        ({
                            key: _key,
                            stock: _stock,
                            stock_alert: _stockAlert,
                            ...item
                        }) => ({
                            ...item,
                            quantity: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                            vat_rate: Number(item.vat_rate),
                            discount: Number(item.discount),
                        }),
                    ),
                },
            });
        } catch (error) {
            receiptWindow?.close();
            throw error;
        }

        if (receiptWindow) {
            writeReceipt(receiptWindow, response.data);
        } else if (shouldPrint) {
            window.alert(
                "Sale saved, but the invoice window was blocked. Allow pop-ups to print invoices.",
            );
        }
        onSaved();
    };

    const handleSubmit = (shouldPrint) => (event) => {
        event.preventDefault();
        if (items.length === 0 || hasStockError) {
            return;
        }

        submit(() => saveSale(shouldPrint));
    };

    return (
        <form onSubmit={handleSubmit(true)} className="space-y-4">
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="mb-4 text-base font-semibold">
                    Sale Information
                </h2>
                <ErrorBanner message={message} />
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Invoice No">
                        <input
                            value={form.sale_no}
                            readOnly
                            className={`${inputClass} bg-slate-50`}
                        />
                    </Field>
                    <Field label="Sale Date" error={first("sale_date")}>
                        <input
                            type="date"
                            value={form.sale_date}
                            onChange={(event) =>
                                setField("sale_date", event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Customer">
                        <CustomerPicker
                            customers={customers}
                            value={form.customer_id}
                            error={first("customer_id")}
                            canCreate={can("customers.create")}
                            onSelect={(customerId) =>
                                setField("customer_id", customerId)
                            }
                            onCreated={(customer) =>
                                setCustomers((current) => [
                                    ...current,
                                    customer,
                                ])
                            }
                        />
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
                            required
                            readOnly
                            value={form.paid_amount}
                            className={`${inputClass} bg-slate-50`}
                        />
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                            Auto-filled from Grand Total.
                        </span>
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
                            Sold Products
                        </h2>
                        <p className="text-sm text-slate-500">
                            Stock is reduced when the sale is saved.
                        </p>
                    </div>
                    <ErrorBanner message={first("items")} />
                </div>
                <ErrorBanner message={productError} />

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="rounded-lg bg-slate-100 p-3">
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
                            ) : isLoadingProducts ? (
                                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-500">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                                    Loading products…
                                </div>
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
                                    const noStock = Number(product.stock) <= 0;
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
                                                    Price:{" "}
                                                    {Number(
                                                        product.price ?? 0,
                                                    ).toFixed(2)}
                                                </div>
                                                {isLowStock(product) ? (
                                                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                                                        <FiAlertTriangle className="h-3 w-3" />
                                                        Low stock · Alert at{" "}
                                                        {product.stock_alert}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={added || noStock}
                                                onClick={() =>
                                                    addProduct(product)
                                                }
                                                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <FiPlus className="h-3.5 w-3.5" />
                                                {added
                                                    ? "Added"
                                                    : noStock
                                                      ? "No stock"
                                                      : "Add"}
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
                                Sold Products
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
                                const overStock =
                                    Number(item.quantity) > Number(item.stock);
                                const stockAlert =
                                    Number(item.stock_alert) || 0;
                                const remainingStock =
                                    Number(item.stock) - Number(item.quantity);
                                const lowAfterSale =
                                    !overStock &&
                                    stockAlert > 0 &&
                                    remainingStock <= stockAlert;
                                const lowStockMessage = lowAfterSale
                                    ? `After this sale: ${remainingStock} left (alert ${stockAlert})`
                                    : isLowStock(item)
                                      ? `Low stock · Alert at ${stockAlert}`
                                      : "";
                                return (
                                    <div
                                        key={item.key}
                                        className={`flex flex-wrap items-end gap-3 rounded-lg border p-3 lg:flex-nowrap ${overStock ? "border-red-200 bg-red-50/40" : lowStockMessage ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"}`}
                                    >
                                        <div className="min-w-[160px] flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {item.product_name}
                                            </div>
                                            <div
                                                className={`text-xs ${overStock ? "text-red-600" : lowStockMessage ? "text-amber-700" : "text-slate-500"}`}
                                            >
                                                {item.product_sku} · Stock:{" "}
                                                {item.stock} · Price:{" "}
                                                {Number(
                                                    item.unit_price ?? 0,
                                                ).toFixed(2)}{" "}
                                                · VAT:{" "}
                                                {Number(
                                                    item.vat_rate ?? 0,
                                                ).toFixed(2)}
                                                %
                                                {overStock
                                                    ? " · Qty exceeds stock"
                                                    : ""}
                                            </div>
                                            {lowStockMessage ? (
                                                <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                                                    <FiAlertTriangle className="h-3 w-3" />
                                                    {lowStockMessage}
                                                </div>
                                            ) : null}
                                        </div>
                                        <label className="w-20 shrink-0 text-xs font-medium text-slate-500">
                                            Qty
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.stock}
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        quantity:
                                                            event.target.value,
                                                    })
                                                }
                                                className={`${inputClass} ${overStock ? "border-red-400" : ""}`}
                                            />
                                        </label>
                                        <label className="w-28 shrink-0 text-xs font-medium text-slate-500">
                                            Unit Price
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        unit_price:
                                                            event.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </label>
                                        <label className="w-20 shrink-0 text-xs font-medium text-slate-500">
                                            VAT Amount
                                            <input
                                                type="text"
                                                value={row.vat.toFixed(2)}
                                                readOnly
                                                className={`${inputClass} cursor-not-allowed bg-slate-50`}
                                            />
                                        </label>
                                        <label className="w-28 shrink-0 text-xs font-medium text-slate-500">
                                            Discount
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.discount}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        discount:
                                                            event.target.value,
                                                    })
                                                }
                                                className={inputClass}
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
                        <span className="text-slate-500">VAT(Included)</span>
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

            <div className="flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={secondaryButton}
                >
                    Back to list
                </button>
                <button
                    type="submit"
                    disabled={cannotSave}
                    className={primaryButton}
                >
                    <FiPrinter className="h-4 w-4" />{" "}
                    {isSaving ? "Saving…" : "Print Invoice & Sell"}
                </button>
                <button
                    type="button"
                    onClick={handleSubmit(false)}
                    disabled={cannotSave}
                    className={secondaryButton}
                >
                    <FiSave className="h-4 w-4" />{" "}
                    {isSaving ? "Saving…" : "Sell"}
                </button>
            </div>
        </form>
    );
}
