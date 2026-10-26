'use client';

import Link from 'next/link';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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

export function ShopProductCard({ product }: { product: CatalogueProduct }) { return <article className="shop-product-card"><div className="product-code">{product.code}</div><p className="catalogue-kicker">{product.family} · {product.form}</p><h2>{product.name}</h2><p>{product.summary}</p><dl className="shop-specs">{product.specs.slice(0, 2).map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl><div className="product-footer"><strong>{product.price ? `₦${product.price.toLocaleString()}` : 'Price on request'}<small> / {product.sellingUnit.split('·')[0]}</small></strong><AddToCartButton product={product} /></div></article>; }
