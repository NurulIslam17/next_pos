import JsBarcode from 'jsbarcode';
import { useEffect, useMemo, useState } from 'react';
import { BsUpcScan } from 'react-icons/bs';
import { FiDownload, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';
import BarcodeLabel, { BARCODE_FORMAT } from '../components/BarcodeLabel';
import { inputClass, primaryButton, rowDeleteButton, secondaryButton } from '../components/ui';

const PAPER_SIZES = {
    a4: { label: 'A4 portrait (210 × 297 mm)', width: 210, height: 297, columns: 4, margin: 8 },
    a4Landscape: { label: 'A4 landscape (297 × 210 mm)', width: 297, height: 210, columns: 5, margin: 8 },
    a5: { label: 'A5 (148 × 210 mm)', width: 148, height: 210, columns: 3, margin: 6 },
    letter: { label: 'Letter (216 × 279 mm)', width: 216, height: 279, columns: 4, margin: 8 },
    label100x50: { label: 'Label 100 × 50 mm', width: 100, height: 50, columns: 2, margin: 4 },
    label1_1x3_5: { label: 'Label 1.1 × 3.5 in (28 × 89 mm)', width: 27.94, height: 88.9, columns: 1, margin: 1 },
    label3_5x1_1: { label: 'Label 3.5 × 1.1 in (89 × 28 mm)', width: 88.9, height: 27.94, columns: 1, margin: 1 },
    custom: { label: 'Custom…', width: 210, height: 297, columns: 4, margin: 8 },
};

const LABEL = { width: 260, height: 150 };
const checkboxLabel = 'flex items-center gap-2 text-sm';

const labelScale = (paper) => {
    const printableWidth = Math.max(paper.width - paper.margin * 2, 20);
    return Math.max(0.6, ((printableWidth / paper.columns) * 4) / LABEL.width);
};

/** Draws every label onto one canvas and returns it as a PNG data URL. */
function renderSheetPng(labels, { showName, showPrice, paper }) {
    const { width, height } = LABEL;
    const scale = labelScale(paper);
    const columns = paper.columns;
    const rows = Math.ceil(labels.length / columns);
    const sheet = document.createElement('canvas');
    sheet.width = Math.round(width * columns * scale);
    sheet.height = Math.round(height * rows * scale);

    const context = sheet.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, sheet.width, sheet.height);
    context.textAlign = 'center';
    context.textBaseline = 'top';

    labels.forEach((product, index) => {
        const x = (index % columns) * width * scale;
        const y = Math.floor(index / columns) * height * scale;
        const centerX = x + (width * scale) / 2;

        context.strokeStyle = '#cbd5e1';
        context.setLineDash([6, 6]);
        context.strokeRect(x + 1, y + 1, width * scale - 2, height * scale - 2);

        let cursor = y + 14 * scale;
        context.fillStyle = '#0f172a';

        if (showName) {
            context.font = `600 ${13 * scale}px sans-serif`;
            context.fillText(product.name.slice(0, 26), centerX, cursor);
            cursor += 20 * scale;
        }

        const barcode = document.createElement('canvas');
        try {
            JsBarcode(barcode, product.sku, { format: BARCODE_FORMAT, width: 2, height: 56, fontSize: 14, margin: 0, displayValue: true });
            const ratio = Math.min(1, (width * scale - 24 * scale) / barcode.width);
            context.drawImage(barcode, centerX - (barcode.width * ratio) / 2, cursor, barcode.width * ratio, barcode.height * ratio);
            cursor += barcode.height * ratio + 6 * scale;
        } catch {
            // skip labels that cannot be encoded
        }

        if (showPrice) {
            context.font = `700 ${13 * scale}px sans-serif`;
            context.fillText(Number(product.price ?? 0).toFixed(2), centerX, cursor);
        }
    });

    return sheet.toDataURL('image/png');
}

export default function Barcodes() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState([]); // [{ product, copies }]
    const [showName, setShowName] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [paperSize, setPaperSize] = useState('a4');
    const [customPaper, setCustomPaper] = useState({ width: 210, height: 297, columns: 4, margin: 8 });
    const [generated, setGenerated] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const term = search.trim();
        if (!term) {
            setResults([]);
            return undefined;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await api('/products', { params: { search: term, per_page: 8 } });
                setResults(response.data);
            } catch (e) {
                setError(e.message);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const selectedIds = useMemo(() => new Set(selected.map((item) => item.product.id)), [selected]);
    const totalLabels = selected.reduce((sum, item) => sum + item.copies, 0);
    const paper = useMemo(
        () => (paperSize === 'custom' ? customPaper : PAPER_SIZES[paperSize]),
        [paperSize, customPaper],
    );

    const setCustomValue = (key) => (event) => {
        const limits = { width: [20, 500], height: [20, 500], columns: [1, 10], margin: [0, 50] };
        const [min, max] = limits[key];
        setCustomPaper({ ...customPaper, [key]: Math.max(min, Math.min(max, Number(event.target.value) || 0)) });
    };

    const addProduct = (product) => {
        if (!selectedIds.has(product.id)) {
            setSelected([...selected, { product, copies: 1 }]);
        }
        setSearch('');
        setResults([]);
    };

    const setCopies = (id, value) =>
        setSelected(selected.map((item) => (item.product.id === id ? { ...item, copies: Math.max(1, Math.min(500, Number(value) || 1)) } : item)));

    const removeProduct = (id) => {
        setSelected(selected.filter((item) => item.product.id !== id));
        setGenerated([]);
    };

    const generate = () => {
        setGenerated(selected.flatMap((item) => Array.from({ length: item.copies }, () => item.product)));
    };

    const download = () => {
        const link = document.createElement('a');
        link.href = renderSheetPng(generated, { showName, showPrice, paper });
        link.download = `barcodes-${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <style>{`@page { size: ${paper.width}mm ${paper.height}mm; margin: ${paper.margin}mm; }`}</style>
            <div className="no-print">
                <h1 className="text-xl font-semibold">Barcodes</h1>
                <p className="text-sm text-slate-500">Pick products, choose how many labels you need, then print or download them. Barcodes are generated from the product code.</p>
            </div>

            {error && <div className="no-print rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="no-print grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-slate-200">
                    <div className="relative">
                        <input
                            type="search"
                            placeholder="Search product name or code to add…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {(results.length > 0 || isSearching) && (
                            <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-slate-200">
                                {isSearching && <li className="px-3 py-2 text-slate-400">Searching…</li>}
                                {results.map((product) => (
                                    <li key={product.id}>
                                        <button
                                            type="button"
                                            disabled={selectedIds.has(product.id)}
                                            onClick={() => addProduct(product)}
                                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <span className="truncate">{product.name}</span>
                                            <span className="shrink-0 font-mono text-xs text-slate-500">{product.sku}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="py-2 pr-4">Code</th>
                                    <th className="py-2 pr-4">Product</th>
                                    <th className="w-28 py-2 pr-4">Copies</th>
                                    <th className="py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selected.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400">No products selected yet.</td>
                                    </tr>
                                )}
                                {selected.map(({ product, copies }) => (
                                    <tr key={product.id}>
                                        <td className="py-2 pr-4 font-mono text-xs">{product.sku}</td>
                                        <td className="py-2 pr-4">{product.name}</td>
                                        <td className="py-2 pr-4">
                                            <input
                                                type="number"
                                                min="1"
                                                max="500"
                                                value={copies}
                                                onChange={(e) => setCopies(product.id, e.target.value)}
                                                className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                                            />
                                        </td>
                                        <td className="py-2 text-right">
                                            <button onClick={() => removeProduct(product.id)} className={rowDeleteButton}>
                                                <FiTrash2 className="h-3.5 w-3.5" /> Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="space-y-4 self-start rounded-xl bg-white p-5 ring-1 ring-slate-200">
                    <h2 className="font-semibold">Label options</h2>
                    <label className={checkboxLabel}>
                        <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} /> Show product name
                    </label>
                    <label className={checkboxLabel}>
                        <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> Show price
                    </label>

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <label htmlFor="paper-size" className="block text-sm font-medium text-slate-700">Customize Paper Size</label>
                        <select
                            id="paper-size"
                            value={paperSize}
                            onChange={(event) => setPaperSize(event.target.value)}
                            className={inputClass}
                        >
                            {Object.entries(PAPER_SIZES).map(([value, option]) => (
                                <option key={value} value={value}>{option.label}</option>
                            ))}
                        </select>

                        {paperSize === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs text-slate-500">
                                    Width (mm)
                                    <input type="number" min="20" max="500" value={customPaper.width} onChange={setCustomValue('width')} className={inputClass} />
                                </label>
                                <label className="text-xs text-slate-500">
                                    Height (mm)
                                    <input type="number" min="20" max="500" value={customPaper.height} onChange={setCustomValue('height')} className={inputClass} />
                                </label>
                                <label className="text-xs text-slate-500">
                                    Columns
                                    <input type="number" min="1" max="10" value={customPaper.columns} onChange={setCustomValue('columns')} className={inputClass} />
                                </label>
                                <label className="text-xs text-slate-500">
                                    Margin (mm)
                                    <input type="number" min="0" max="50" value={customPaper.margin} onChange={setCustomValue('margin')} className={inputClass} />
                                </label>
                            </div>
                        )}

                        <p className="text-xs text-slate-400">
                            {paper.width} × {paper.height} mm · {paper.columns} per row
                        </p>
                    </div>

                    <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {selected.length} products · <strong>{totalLabels}</strong> labels
                    </div>

                    <button
                        onClick={generate}
                        disabled={selected.length === 0}
                        className={`${primaryButton} w-full`}
                    >
                        <BsUpcScan className="h-4 w-4" /> Generate barcodes
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => window.print()}
                            disabled={generated.length === 0}
                            className={secondaryButton}
                        >
                            <FiPrinter className="h-4 w-4" /> Print
                        </button>
                        <button
                            onClick={download}
                            disabled={generated.length === 0}
                            className={secondaryButton}
                        >
                            <FiDownload className="h-4 w-4" /> Download PNG
                        </button>
                    </div>
                </aside>
            </div>

            {generated.length > 0 && (
                <section>
                    <h2 className="no-print mb-3 font-semibold">Preview ({generated.length} labels)</h2>
                    <div id="print-area" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${paper.columns}, minmax(0, 1fr))` }}>
                        {generated.map((product, index) => (
                            <BarcodeLabel key={`${product.id}-${index}`} product={product} showName={showName} showPrice={showPrice} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
