'use client';

import Link from 'next/link';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

function convertSize(size: string, unit: 'mm' | 'in') {
  const toNumber = (value: string) => value.includes('/') ? Number(value.split('/')[0]) / Number(value.split('/')[1]) : Number(value);
  const format = (value: number, suffix: string) => `${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} ${suffix}`;
  if (unit === 'mm') return size.replace(/(\d+(?:\.\d+)?(?:\/\d+)?)\s*in/g, (_, value) => format(toNumber(value) * 25.4, 'mm'));
  return size.replace(/(\d+(?:\.\d+)?)\s*mm/g, (_, value) => format(Number(value) / 25.4, 'in'));
}
import type { CatalogueProduct } from './site-data';

export type CartLine = { product: CatalogueProduct; quantity: number };

type CartContextValue = { lines: CartLine[]; count: number; total: number; add: (product: CatalogueProduct) => void; update: (id: string, quantity: number) => void; remove: (id: string) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const add = (product: CatalogueProduct) => setLines((current) => { const existing = current.find((line) => line.product.id === product.id); return existing ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { product, quantity: 1 }]; });
  const update = (id: string, quantity: number) => setLines((current) => quantity > 0 ? current.map((line) => line.product.id === id ? { ...line, quantity: Math.min(999, quantity) } : line) : current.filter((line) => line.product.id !== id));
  const remove = (id: string) => update(id, 0);
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const total = useMemo(() => lines.reduce((sum, line) => sum + (line.product.price ?? 0) * line.quantity, 0), [lines]);
  return <CartContext.Provider value={{ lines, count, total, add, update, remove, clear: () => setLines([]) }}>{children}</CartContext.Provider>;
}

export function useShopCart() { const value = useContext(CartContext); if (!value) throw new Error('useShopCart must be used inside ShopCartProvider'); return value; }

export function CartLink() { const { count } = useShopCart(); return <Link className="cart-link" href="/checkout" aria-label={`Cart with ${count} items`}>Cart <span>{count}</span></Link>; }

export function AddToCartButton({ product }: { product: CatalogueProduct }) { const { add } = useShopCart(); const [added, setAdded] = useState(false); return <button className="add-cart-button" type="button" onClick={() => { add(product); setAdded(true); window.setTimeout(() => setAdded(false), 1400); }}>{added ? 'Added to cart' : 'Add to cart'} <span aria-hidden="true">+</span></button>; }

export function ShopProductCard({ product }: { product: CatalogueProduct }) {
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const sizes = product.sizes?.length ? product.sizes : ['Custom cut'];
  return <article className="shop-product-card">
    <h2>{product.name}</h2>
    <p>{product.summary}</p>
    <div className="product-options">
      <div><label htmlFor={`${product.id}-size`}>Size / cut</label><select id={`${product.id}-size`} defaultValue={sizes[0]}>{sizes.map((size) => <option key={size} value={size}>{convertSize(size, unit)}</option>)}</select></div>
      <div><label htmlFor={`${product.id}-unit`}>Units</label><select id={`${product.id}-unit`} value={unit} onChange={(event) => setUnit(event.target.value as 'mm' | 'in')}><option value="mm">Millimetres (mm)</option><option value="in">Inches (in)</option></select></div>
    </div>
    <dl className="shop-specs">
      <div><dt>Type</dt><dd>{product.types?.join(' · ')}</dd></div>
      <div><dt>Grade</dt><dd>{product.grades?.join(' · ')}</dd></div>
      <div><dt>Finish</dt><dd>{product.finishes?.join(' · ')}</dd></div>
    </dl>
    <div className="product-footer"><strong>₦{product.price.toLocaleString()}<small> / {product.sellingUnit}</small></strong><AddToCartButton product={product} /></div>
  </article>;
}
