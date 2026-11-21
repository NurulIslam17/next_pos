import { useCallback, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { primaryButton, rowDeleteButton, rowEditButton, secondaryButton } from '../components/ui';

const money = (value) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#f1f5f9"/>
  <path d="M28 38h104v84H28zM28 99l31-31 24 24 18-18 31 31" fill="none" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="103" cy="61" r="8" fill="none" stroke="#94a3b8" stroke-width="6"/>
  <text x="80" y="142" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#64748b">No image</text>
</svg>
`)}`;

function ProductPhoto({ image, className = '' }) {
    const label = image?.original_name ?? 'No product image';

    return (
        <img
            src={image?.url || PLACEHOLDER_IMAGE}
            alt={label}
            title={label}
            onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
            className={className}
        />
    );
}

function Detail({ label, children, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-800">{children ?? '—'}</dd>
        </div>
    );
}

function ProductDetails({ product }) {
    return (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Name" className="col-span-2 sm:col-span-3">{product.name}</Detail>
            <Detail label="SKU / Code">{product.sku}</Detail>
            <Detail label="Category">{product.category}</Detail>
            <Detail label="Brand">{product.brand}</Detail>
            <Detail label="Supplier">{product.supplier}</Detail>
            <Detail label="Shop">{product.created_by_shop}</Detail>
            <Detail label="Cost price">{money(product.cost_price)}</Detail>
            <Detail label="Selling price">{money(product.price)}</Detail>
            <Detail label="VAT">{Number(product.vat ?? 0).toFixed(2)}% ({product.vat_type === 'excluded' ? 'Excluded' : 'Included'})</Detail>
            <Detail label="Stock">{product.stock}</Detail>
            <Detail label="Stock alert">{product.stock_alert}</Detail>
            <Detail label="Status">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                </span>
            </Detail>
            <Detail label="Note" className="col-span-2 sm:col-span-3">{product.note}</Detail>
            <Detail label="Photos" className="col-span-2 sm:col-span-3">
                        {product.images?.length ? (
                            <div className="flex flex-wrap gap-2">
                                {product.images.map((image) => (
                                    <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                                        <ProductPhoto image={image} className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <ProductPhoto className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
                        )}
            </Detail>
            <Detail label="Created at">{product.created_at}</Detail>
            <Detail label="Updated at">{product.updated_at}</Detail>
        </dl>
    );
}

export default function Products() {
    const { can } = useAuth();
    const canCreate = can('products.create');
    const canEdit = can('products.update');
    const canDelete = can('products.delete');
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryId = searchParams.get('category_id') ?? '';
    const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit
    const [details, setDetails] = useState(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api('/products', { params: { search: query, category_id: categoryId, page, per_page: 10 } });
            setProducts(response.data);
            setMeta(response.meta);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [query, categoryId, page]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        api('/categories/all').then((response) => setCategories(response.data)).catch(() => {});
        api('/brands').then((response) => setBrands(response.data)).catch(() => {});
        api('/suppliers').then((response) => setSuppliers(response.data)).catch(() => {});
    }, []);

    // Debounce the search box so we don't hit the API on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete "${product.name}"?`)) return;
        try {
            await api(`/products/${product.id}`, { method: 'DELETE' });
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleSaved = () => {
        setEditing(null);
        load();
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Products</h1>
                    {meta && <p className="text-sm text-slate-500">{meta.total.toLocaleString()} items</p>}
                </div>
                <div className="flex gap-2">
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            setPage(1);
                            setSearchParams(e.target.value ? { category_id: e.target.value } : {});
                        }}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    <input
                        type="search"
                        placeholder="Search name or code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {canCreate && (
                        <button onClick={() => setEditing({})} className={primaryButton}>
                            <FiPlus className="h-4 w-4" /> Add product
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3">SL</th>
                            <th className="px-4 py-3">Photo</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Brand</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3 text-right">Cost</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Stock</th>
                            <th className="px-4 py-3 text-right">Stock alert</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading && (
                            <tr>
                                <td colSpan={12} className="px-4 py-10 text-center text-slate-400">Loading…</td>
                            </tr>
                        )}
                        {!isLoading && products.length === 0 && (
                            <tr>
                                <td colSpan={12} className="px-4 py-10 text-center text-slate-400">No products found.</td>
                            </tr>
                        )}
                        {!isLoading &&
                            products.map((product,index) => (
                                <tr key={product.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        <ProductPhoto image={product.images?.[0]} className="h-10 w-10 rounded object-cover ring-1 ring-slate-200" />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{product.sku}</td>
                                    <td className="px-4 py-3 font-medium">{product.name}</td>
                                    <td className="px-4 py-3 text-slate-600">{product.category ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{product.brand ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{product.supplier ?? '—'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{money(product.cost_price)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{money(product.price)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{product.stock}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <span className={Number(product.stock_alert) > 0 && Number(product.stock) <= Number(product.stock_alert) ? 'font-medium text-red-600' : 'text-slate-600'}>
                                            {product.stock_alert}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center">
                                        <button onClick={() => setDetails(product)} className={`${rowEditButton} mr-2`}>
                                            <FiEye className="h-3.5 w-3.5" /> Details
                                        </button>
                                        {canEdit && (
                                            <button onClick={() => setEditing(product)} className={`${rowEditButton} mr-2`}>
                                                <FiEdit2 className="h-3.5 w-3.5" /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => handleDelete(product)} className={rowDeleteButton}>
                                                <FiTrash2 className="h-3.5 w-3.5" /> Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={secondaryButton}>
                            <FiChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} className={secondaryButton}>
                            Next <FiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {editing && (
                <Modal title={editing.id ? 'Edit product' : 'Add product'} onClose={() => setEditing(null)} size="lg">
                    <ProductForm product={editing.id ? editing : null} categories={categories} brands={brands} suppliers={suppliers} onSaved={handleSaved} onCancel={() => setEditing(null)} />
                </Modal>
            )}
            {details && (
                <Modal title={`Product details — ${details.name}`} onClose={() => setDetails(null)}>
                    <ProductDetails product={details} />
                </Modal>
            )}
        </div>
    );
}
