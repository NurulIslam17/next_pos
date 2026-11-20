"""Rebuild categories.json and products.json from the Excel files in /data.

Run from the project root:  python database/seeders/data/extract_products.py
Needs: pip install openpyxl

Product sources (unique by SKU / item code):
  1. items xlsx -> name, SKU, category
  2. sales xlsx -> cost/selling price (last sale wins) and any code missing from items
"""
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ITEMS = ROOT / "data" / "items (1).xlsx"
SALES = ROOT / "data" / "sales (1).xlsx"


def norm_code(code) -> str:
    """Trim, upper-case and fix missing dash, e.g. 'PTK507' -> 'PTK-507'."""
    code = str(code).strip().upper()
    m = re.fullmatch(r"([A-Z]+)-?(\d+)", code)
    return f"{m.group(1)}-{m.group(2)}" if m else code


def norm_category(name) -> str:
    name = (name or "Uncategorized").strip()
    return name[0].upper() + name[1:]


products: dict[str, dict] = {}

# 1. Items file
for _, item, category in openpyxl.load_workbook(ITEMS, read_only=True, data_only=True).active.iter_rows(min_row=2, values_only=True):
    m = re.match(r"^(.*)\(([^()]*)\)\s*$", str(item).strip())
    name, code = m.group(1).strip(), norm_code(m.group(2))
    products.setdefault(code, dict(name=name, sku=code, category=norm_category(category), cost_price=0, price=0))

# 2. Sales file (item rows have the code in column E)
for r in openpyxl.load_workbook(SALES, read_only=True, data_only=True).active.iter_rows(min_row=9, values_only=True):
    if not r[4] or r[4] == "Code":
        continue
    code = norm_code(r[4])
    p = products.setdefault(code, dict(name=str(r[5]).strip(), sku=code, category="Uncategorized", cost_price=0, price=0))
    if isinstance(r[6], (int, float)) and isinstance(r[7], (int, float)):
        p["cost_price"], p["price"] = r[6], r[7]

categories = sorted({p["category"] for p in products.values()})
(OUT / "categories.json").write_text(json.dumps(categories, ensure_ascii=False, indent=1), encoding="utf-8")
(OUT / "products.json").write_text(json.dumps(list(products.values()), ensure_ascii=False), encoding="utf-8")
print(f"{len(categories)} categories, {len(products)} products, {sum(p['price'] == 0 for p in products.values())} without price")
