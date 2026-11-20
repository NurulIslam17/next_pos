import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

export const BARCODE_FORMAT = 'CODE128';

export default function BarcodeLabel({ product, showName, showPrice }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!svgRef.current) return;
        try {
            JsBarcode(svgRef.current, product.sku, {
                format: BARCODE_FORMAT,
                width: 1.6,
                height: 44,
                fontSize: 12,
                margin: 0,
                displayValue: true,
            });
        } catch {
            // Unencodable value: leave the SVG empty rather than crash the page.
        }
    }, [product.sku]);

    return (
        <div className="barcode-label flex flex-col items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-white px-2 py-2 text-center">
            {showName && <div className="w-full truncate text-[11px] font-semibold leading-tight text-slate-900">{product.name}</div>}
            <svg ref={svgRef} className="max-w-full" />
            {showPrice && <div className="text-[11px] font-bold leading-tight text-slate-900">{Number(product.price ?? 0).toFixed(2)}</div>}
        </div>
    );
}
