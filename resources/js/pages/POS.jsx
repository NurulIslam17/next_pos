import { useEffect, useMemo, useRef, useState } from "react";
import {
    FiAlertTriangle,
    FiDelete,
    FiLogOut,
    FiPlus,
    FiPrinter,
    FiSave,
    FiSearch,
    FiShoppingCart,
    FiTrash2,
} from "react-icons/fi";
import { BsUpcScan } from "react-icons/bs";
import { api } from "../api";
import { useAuth } from "../auth";
import CreatableSelect, { optionCode } from "../components/CreatableSelect";
import {
    ErrorBanner,
    Field,
    inputClass,
    primaryButton,
    dangerButton,
    secondaryButton,
    useSubmit,
} from "../components/ui";
import Modal from "../components/Modal";

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const money = (v) => Number(v ?? 0).toFixed(2);
const today = () => new Date().toISOString().slice(0, 10);
const makeKey = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const calculate = (item) => {
    const base = round2(Number(item.quantity) * Number(item.unit_price));
    const discount = Math.min(round2(Number(item.discount) || 0), base);
    const net = round2(base - discount);
    const rate = Number(item.vat_rate) || 0;
    const vat = round2(net - net / (1 + rate / 100));
    return { base, discount, vat, total: net };
};
const isLowStock = (product) => {
    const alert = Number(product.stock_alert) || 0;
    const stock = Number(product.stock) || 0;
    return alert > 0 && stock > 0 && stock <= alert;
};
const escapeHtml = (value) =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c],
    );

function writeReceipt(printWindow, sale, printedBy = "") {
    const itemRows = (sale.items ?? [])
        .map((item) => {
            const discount = Number(item.discount ?? 0);
            const vatRate = Number(item.vat_rate ?? 0);
            const vatType = item.vat_type ?? "included";
            return `<tr><td colspan="4"><div>${escapeHtml(item.product_name)}${item.product_sku ? ` (${escapeHtml(item.product_sku)})` : ""}</div><div class="muted" style="font-size:9px;display:flex;justify-content:space-between;gap:4px;"><span>${item.quantity} x ${money(item.unit_price)} ${vatRate > 0 ? `${vatRate}%(${escapeHtml(vatType)})` : ""} ${discount > 0 ? `Disc: ${money(discount)}` : ""}</span><span>${money(item.line_total)}</span></div></td></tr>`;
        })
        .join("");
    printWindow.document.write(
        `<!doctype html><html><head><title>Invoice ${escapeHtml(sale.sale_no)}</title><style>@page{size:80mm auto;margin:2mm}*{box-sizing:border-box}body{width:76mm;margin:0 auto;font-family:Arial,sans-serif;font-size:11px;color:#111}h1{font-size:14px;margin:0;text-align:center}p{margin:1px 0}.muted{color:#555}.center{text-align:center}.right{text-align:right}.line{border-top:1px dashed #333;margin:4px 0}table{width:100%;border-collapse:collapse}th,td{padding:2px 0;vertical-align:top}th{text-align:left;font-size:10px;border-bottom:1px dashed #333}.totals div{display:flex;justify-content:space-between}.grand{font-weight:bold;border-top:1px dashed #333;margin-top:2px;padding-top:2px}.footer{margin-top:6px;text-align:center;font-size:10px}@media print{body{width:auto;margin:0}}</style></head><body><h1>${escapeHtml(sale.shop_name ?? "INVOICE")}</h1><p class="center muted">Sales Invoice</p><div class="line"></div><p>Invoice: ${escapeHtml(sale.sale_no)}</p><p>Date: ${escapeHtml(sale.sale_date)}</p>    <p>Customer: ${escapeHtml(sale.customer_name ?? "Walk-in Customer")}</p><p>Sold By: ${escapeHtml(sale.created_by_name ?? "-")}</p><p>Payment: ${escapeHtml(sale.payment_type_name ?? "-")}</p><div class="line"></div><table><thead><tr><th>Item / Details</th></tr></thead><tbody>${itemRows}</tbody></table><div class="line"></div><div class="totals"><div><span>Subtotal</span><span>${money(sale.subtotal)}</span></div><div><span>Discount</span><span>-${money(sale.discount)}</span></div><div><span>VAT (Included)</span><span>${money(sale.vat)}</span></div><div class="grand"><span>Grand Total</span><span>${money(sale.total)}</span></div><div><span>Paid</span><span>${money(sale.paid_amount)}</span></div><div><span>Due</span><span>${money(sale.due_amount)}</span></div></div>    ${printedBy ? `<p class="center muted">Printed By: ${escapeHtml(printedBy)}</p>` : ""}<p class="footer">Thank you for your purchase.</p></body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
}

function ProductCard({ product, onAdd }) {
    const out = Number(product.stock) <= 0;
    const low = isLowStock(product);
    return (
        <button
            type="button"
            disabled={out}
            onClick={() => onAdd(product)}
            className={`group overflow-hidden rounded-xl border text-left transition ${out ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : low ? "border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:shadow-md" : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md"}`}
        >
            <div className="h-32 w-full overflow-hidden bg-slate-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <FiShoppingCart className="h-10 w-10 text-slate-300" />
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="truncate text-sm font-semibold text-slate-900">
                    {product.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                    {product.sku || "No SKU"}
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-700">
                        {money(product.price)}
                    </span>
                    <span
                        className={`text-xs ${out ? "text-rose-600" : low ? "font-medium text-amber-700" : "text-slate-500"}`}
                    >
                        {out ? "Out" : `Stock ${product.stock}`}
                    </span>
                </div>
                {low && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                        <FiAlertTriangle className="h-3 w-3" />
                        Low stock · Alert {product.stock_alert}
                    </div>
                )}
            </div>
        </button>
    );
}

export default function POS() {
    const { user, can } = useAuth();
    const isManager = user?.role === "manager";
    const barcodeRef = useRef(null);
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [barcode, setBarcode] = useState("");
    const [productError, setProductError] = useState("");
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const { message, isSaving, submit, first } = useSubmit();
    const [form, setForm] = useState({
        sale_no: "",
        sale_date: today(),
        customer_id: "",
        shop_id: isManager ? String(user.shop_id ?? "") : "",
        payment_type_id: "",
        reference_no: "",
        note: "",
    });
    const setField = (k, v) => setForm((c) => ({ ...c, [k]: v }));

    useEffect(() => {
        Promise.all([
            api("/customers/all"),
            api("/shops"),
            api("/payment-types"),
        ])
            .then(([c, s, p]) => {
                const shopList = s.data ?? [];
                setCustomers(c.data ?? []);
                setShops(shopList);
                setPaymentTypes(p.data ?? []);
                if (!isManager)
                    setForm((cur) =>
                        cur.shop_id || !shopList.length
                            ? cur
                            : { ...cur, shop_id: String(shopList[0].id) },
                    );
            })
            .catch(() => {});
    }, [isManager]);
    useEffect(() => {
        api("/sales/next-number", {
            params: { shop_id: form.shop_id || undefined },
        })
            .then((r) => setField("sale_no", r.data.sale_no))
            .catch(() => {});
    }, [form.shop_id]);
    useEffect(() => {
        let active = true;
        setIsLoadingProducts(true);
        setProductError("");
        api("/products/all", { params: { shop_id: form.shop_id || undefined } })
            .then((r) => {
                if (active) setProducts(r.data ?? []);
            })
            .catch((e) => {
                if (active) {
                    setProducts([]);
                    setProductError(e.message);
                }
            })
            .finally(() => {
                if (active) setIsLoadingProducts(false);
            });
        return () => {
            active = false;
        };
    }, [form.shop_id]);

    const filteredProducts = useMemo(() => {
        const t = productSearch.trim().toLowerCase();
        const inStock = products.filter((p) => Number(p.stock) > 0);
        const filtered = !t
            ? inStock
            : inStock.filter((p) =>
                  [p.name, p.sku, p.category_name, p.brand_name].some((v) =>
                      String(v ?? "")
                          .toLowerCase()
                          .includes(t),
                  ),
              );
        return filtered.slice(0, 50);
    }, [products, productSearch]);
    const totals = useMemo(() => {
        const rows = items.map(calculate);
        const subtotal = round2(rows.reduce((s, r) => s + r.base, 0));
        const discount = round2(rows.reduce((s, r) => s + r.discount, 0));
        const vat = round2(rows.reduce((s, r) => s + r.vat, 0));
        const total = round2(subtotal - discount);
        return { subtotal, discount, vat, total, paid: total, due: 0 };
    }, [items]);
    const addProduct = (product) => {
        if (!product || Number(product.stock) <= 0) return;
        if (!isManager && !form.shop_id && product.created_by_shop_id)
            setField("shop_id", String(product.created_by_shop_id));
        if (
            !isManager &&
            form.shop_id &&
            String(product.created_by_shop_id ?? "") !== String(form.shop_id)
        ) {
            setProductError(
                "Selected cart shop differs from this product shop. Clear cart or choose matching shop.",
            );
            return;
        }
        setItems((current) => {
            const existing = current.find((i) => i.product_id === product.id);
            if (existing)
                return current.map((i) =>
                    i.product_id === product.id
                        ? {
                              ...i,
                              quantity: Math.min(
                                  Number(i.quantity) + 1,
                                  Number(product.stock),
                              ),
                          }
                        : i,
                );
            return [
                ...current,
                {
                    key: makeKey(),
                    product_id: product.id,
                    product_name: product.name,
                    product_sku: product.sku,
                    shop_id: product.created_by_shop_id,
                    stock: Number(product.stock ?? 0),
                    stock_alert: Number(product.stock_alert ?? 0),
                    quantity: 1,
                    unit_price: Number(product.price ?? 0),
                    vat_rate: Number(product.vat ?? 0),
                    discount: 0,
                },
            ];
        });
    };
    const updateItem = (key, changes) =>
        setItems((c) =>
            c.map((i) => (i.key === key ? { ...i, ...changes } : i)),
        );
    const removeItem = (key) => setItems((c) => c.filter((i) => i.key !== key));
    const hasStockError = items.some(
        (i) => Number(i.quantity) > Number(i.stock) || Number(i.quantity) < 1,
    );
    const selectedShopId = form.shop_id ? String(form.shop_id) : "";
    const cartShopMismatch =
        !isManager &&
        selectedShopId &&
        items.some((i) => String(i.shop_id ?? "") !== selectedShopId);
    const cannotSave =
        isSaving ||
        items.length === 0 ||
        hasStockError ||
        !form.shop_id ||
        cartShopMismatch;

    const addByBarcode = (e) => {
        e.preventDefault();
        const code = barcode.trim().toLowerCase();
        if (!code) return;
        const product = products.find((p) =>
            [p.sku, p.barcode, p.name].some(
                (v) => String(v ?? "").toLowerCase() === code,
            ),
        );
        if (product) {
            addProduct(product);
            setBarcode("");
            setProductError("");
        } else setProductError(`No product found for "${barcode.trim()}".`);
    };
    const resetSale = () => {
        setItems([]);
        setBarcode("");
        setProductSearch("");
        setProductError("");
        setForm((c) => ({
            ...c,
            customer_id: "",
            payment_type_id: "",
            reference_no: "",
            note: "",
        }));
        barcodeRef.current?.focus();
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
                    items: items.map(({ key: _k, stock: _s, ...item }) => ({
                        ...item,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        vat_rate: Number(item.vat_rate),
                        discount: Number(item.discount),
                    })),
                },
            });
        } catch (err) {
            receiptWindow?.close();
            throw err;
        }
        if (receiptWindow)
            writeReceipt(receiptWindow, response.data, user?.name ?? "");
        else if (shouldPrint)
            window.alert(
                "Sale saved, but the invoice window was blocked. Allow pop-ups to print invoices.",
            );
        resetSale();
        api("/sales/next-number", {
            params: { shop_id: form.shop_id || undefined },
        })
            .then((r) => setField("sale_no", r.data.sale_no))
            .catch(() => {});
    };

    const currentShop = shops.find(
        (s) => String(s.id) === String(form.shop_id),
    );
    const shopLabel =
        currentShop?.name || (isManager ? (user?.shop ?? "Shop") : "All Shops");

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <img
                        src="/shopflow-mark.svg"
                        alt="ShopFlow"
                        className="h-9 w-9 rounded-xl"
                    />
                    <div>
                        <div className="text-lg font-bold leading-tight text-slate-900">
                            ShopFlow POS
                        </div>
                        <div className="text-xs text-slate-500">
                            Point of Sale
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">
                            {shopLabel}
                        </div>
                        <div className="text-xs text-slate-500">
                            {user?.name}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowExitConfirm(true)}
                        className="inline-flex items-center gap-2 rounded-md border text-amber-50 bg-red-500 px-3 py-2 text-sm font-medium hover:bg-red-400"
                    >
                        <FiLogOut className="h-4 w-4 text-amber-50" /> Exit
                    </button>
                </div>
            </header>
            <div className="min-h-0 flex-1 p-4">
                <div className="grid h-full gap-4 xl:grid-cols-5">
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
                        <div className="mb-4 flex shrink-0 items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">
                                    POS
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Scan barcode or pick products to sell.
                                </p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-right">
                                <div className="text-xs text-emerald-700">
                                    Invoice
                                </div>
                                <div className="font-semibold text-emerald-900">
                                    {form.sale_no || "—"}
                                </div>
                            </div>
                        </div>
                        <ErrorBanner message={message} />
                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                            <form
                                onSubmit={addByBarcode}
                                className="mb-4 flex gap-2"
                            >
                                <div className="relative flex-1">
                                    <BsUpcScan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        ref={barcodeRef}
                                        value={barcode}
                                        onChange={(e) =>
                                            setBarcode(e.target.value)
                                        }
                                        placeholder="Scan barcode / enter SKU and press Enter"
                                        className={`${inputClass} pl-9`}
                                        disabled={isLoadingProducts}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={secondaryButton}
                                    disabled={isLoadingProducts}
                                >
                                    <FiPlus className="h-4 w-4" /> Add
                                </button>
                            </form>
                            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                <Field label="Shop" error={first("shop_id")}>
                                    <select
                                        value={form.shop_id}
                                        disabled={isManager}
                                        onChange={(e) => {
                                            setField("shop_id", e.target.value);
                                            if (items.length) setItems([]);
                                        }}
                                        className={inputClass}
                                    >
                                        {isManager && (
                                            <option value="">
                                                Select shop
                                            </option>
                                        )}
                                        {shops.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.code})
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Sale Date"
                                    error={first("sale_date")}
                                >
                                    <input
                                        type="date"
                                        value={form.sale_date}
                                        onChange={(e) =>
                                            setField(
                                                "sale_date",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Customer">
                                    <CreatableSelect
                                        value={form.customer_id}
                                        onChange={(v) =>
                                            setField("customer_id", v)
                                        }
                                        options={customers}
                                        placeholder="Walk-in Customer"
                                        canCreate={can("customers.create")}
                                        endpoint="/customers"
                                        createPayload={(name) => ({
                                            name,
                                            code: optionCode(name, "CUS", 12),
                                        })}
                                        onCreated={(c) =>
                                            setCustomers((cur) => [...cur, c])
                                        }
                                    />
                                </Field>
                                <Field label="Payment Type">
                                    <CreatableSelect
                                        value={form.payment_type_id}
                                        onChange={(v) =>
                                            setField("payment_type_id", v)
                                        }
                                        options={paymentTypes}
                                        placeholder="Select payment"
                                        canCreate={can("payment_types.create")}
                                        endpoint="/payment-types"
                                        createPayload={(name) => ({
                                            name,
                                            code: optionCode(name, "PAY", 12),
                                        })}
                                        onCreated={(p) =>
                                            setPaymentTypes((cur) => [
                                                ...cur,
                                                p,
                                            ])
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="max-h-[min(36vh,360px)] overflow-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Product
                                                </th>
                                                <th className="px-3 py-2 w-20">
                                                    Qty
                                                </th>
                                                <th className="px-3 py-2 w-24">
                                                    Price
                                                </th>
                                                <th className="px-3 py-2 w-24">
                                                    Disc
                                                </th>
                                                <th className="px-3 py-2 w-24 text-right">
                                                    Total
                                                </th>
                                                <th className="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-3 py-10 text-center text-slate-400"
                                                    >
                                                        Scan barcode or click a
                                                        product to add it.
                                                    </td>
                                                </tr>
                                            )}
                                            {items.map((item) => {
                                                const row = calculate(item);
                                                const over =
                                                    Number(item.quantity) >
                                                    Number(item.stock);
                                                const remaining =
                                                    Number(item.stock) -
                                                    Number(item.quantity);
                                                const alert =
                                                    Number(item.stock_alert) ||
                                                    0;
                                                const lowAfterSale =
                                                    !over &&
                                                    alert > 0 &&
                                                    remaining <= alert;
                                                const lowNow =
                                                    !lowAfterSale &&
                                                    isLowStock(item);
                                                return (
                                                    <tr
                                                        key={item.key}
                                                        className={
                                                            over
                                                                ? "bg-rose-50/40"
                                                                : lowAfterSale ||
                                                                    lowNow
                                                                  ? "bg-amber-50/40"
                                                                  : ""
                                                        }
                                                    >
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium text-slate-900">
                                                                {
                                                                    item.product_name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    item.product_sku
                                                                }{" "}
                                                                · Stock{" "}
                                                                {item.stock}
                                                            </div>
                                                            {(lowAfterSale ||
                                                                lowNow) && (
                                                                <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                                                    <FiAlertTriangle className="h-3 w-3" />
                                                                    {lowAfterSale
                                                                        ? `After sale: ${remaining} left (alert ${alert})`
                                                                        : `Low stock · Alert ${alert}`}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.stock}
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.key,
                                                                        {
                                                                            quantity:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className={`${inputClass} ${over ? "border-rose-400" : ""}`}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    item.unit_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.key,
                                                                        {
                                                                            unit_price:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className={
                                                                    inputClass
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    item.discount
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.key,
                                                                        {
                                                                            discount:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                className={
                                                                    inputClass
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium">
                                                            {money(row.total)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        item.key,
                                                                    )
                                                                }
                                                                className="text-slate-400 hover:text-rose-600"
                                                            >
                                                                <FiTrash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {hasStockError && (
                                <p className="mt-2 text-sm text-rose-600">
                                    Check quantities: item quantity must be
                                    within available stock.
                                </p>
                            )}
                            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_260px]">
                                <Field label="Note">
                                    <textarea
                                        value={form.note}
                                        onChange={(e) =>
                                            setField("note", e.target.value)
                                        }
                                        className={inputClass}
                                        rows={4}
                                        placeholder="Optional note..."
                                    />
                                </Field>
                                <div className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Subtotal
                                        </span>
                                        <span>{money(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Discount
                                        </span>
                                        <span>-{money(totals.discount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            VAT (Included)
                                        </span>
                                        <span>{money(totals.vat)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                                        <span>Grand Total</span>
                                        <span>{money(totals.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Paid</span>
                                        <span>{money(totals.paid)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={resetSale}
                                    className={secondaryButton}
                                >
                                    <FiDelete className="h-4 w-4" /> Clear
                                </button>
                                <button
                                    type="button"
                                    disabled={cannotSave}
                                    onClick={() =>
                                        submit(() => saveSale(false))
                                    }
                                    className={secondaryButton}
                                >
                                    <FiSave className="h-4 w-4" />{" "}
                                    {isSaving ? "Saving…" : "Sell"}
                                </button>
                                <button
                                    type="button"
                                    disabled={cannotSave}
                                    onClick={() => submit(() => saveSale(true))}
                                    className={primaryButton}
                                >
                                    <FiPrinter className="h-4 w-4" />{" "}
                                    {isSaving
                                        ? "Saving…"
                                        : "Print Invoice & Sell"}
                                </button>
                            </div>
                        </div>
                    </section>
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 xl:col-span-3">
                        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Products
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Click a product to add it to cart.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={productSearch}
                                    onChange={(e) =>
                                        setProductSearch(e.target.value)
                                    }
                                    placeholder="Search product / SKU..."
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                        </div>
                        {productError && (
                            <div className="mb-3 shrink-0 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                {productError}
                            </div>
                        )}
                        {cartShopMismatch && (
                            <div className="mb-3 shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                Cart contains items from another shop. Select
                                matching shop or clear cart before selling.
                            </div>
                        )}
                        {isLoadingProducts ? (
                            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                                Loading products…
                            </div>
                        ) : (
                            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto pr-1 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAdd={addProduct}
                                    />
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-sm text-slate-500">
                                        No products found.
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            {showExitConfirm && (
                <Modal
                    title="Exit POS"
                    onClose={() => setShowExitConfirm(false)}
                >
                    <p className="text-sm text-slate-600">
                        Are you sure you want to exit POS? This tab will be
                        closed.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowExitConfirm(false)}
                            className={secondaryButton}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                window.close();
                                setTimeout(() => {
                                    window.location.href = "/dashboard";
                                }, 150);
                            }}
                            className={dangerButton}
                        >
                            <FiLogOut className="h-4 w-4" /> Exit POS
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
