'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogueProducts, type CatalogueProduct } from './site-data';

export type CartLine = { product: CatalogueProduct; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number | null;
  add: (product: CatalogueProduct) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CART_STORAGE_KEY = 'qutlas-shop-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

function restoreCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];

    const restored: CartLine[] = [];
    for (const entry of saved) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        !('id' in entry) ||
        !('quantity' in entry) ||
        typeof entry.id !== 'string' ||
        typeof entry.quantity !== 'number' ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity < 1 ||
        entry.quantity > 999
      ) continue;

      const product = catalogueProducts.find((item) => item.id === entry.id);
      if (product) restored.push({ product, quantity: entry.quantity });
    }
    return restored;
  } catch {
    return [];
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(restoreCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(lines.map(({ product, quantity }) => ({ id: product.id, quantity }))),
      );
    } catch {
      // The cart still works for this session if browser storage is unavailable.
    }
  }, [hydrated, lines]);

  const add = (product: CatalogueProduct) => setLines((current) => {
    const existing = current.find((line) => line.product.id === product.id);
    if (existing) {
      return current.map((line) => line.product.id === product.id
        ? { ...line, quantity: Math.min(999, line.quantity + 1) }
        : line);
    }
    return [...current, { product, quantity: 1 }];
  });

  const update = (id: string, quantity: number) => setLines((current) =>
    quantity > 0
      ? current.map((line) => line.product.id === id
        ? { ...line, quantity: Math.max(1, Math.min(999, Math.floor(quantity))) }
        : line)
      : current.filter((line) => line.product.id !== id),
  );

  const remove = (id: string) => update(id, 0);
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const total = useMemo(() => {
    if (lines.length === 0) return 0;
    if (lines.some(({ product }) => product.status !== 'verified' || typeof product.price !== 'number')) {
      return null;
    }
    return lines.reduce((sum, line) => sum + (line.product.price as number) * line.quantity, 0);
  }, [lines]);

  return (
    <CartContext.Provider value={{ lines, count, total, add, update, remove, clear: () => setLines([]) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useShopCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useShopCart must be used inside ShopCartProvider');
  return value;
}

export function CartLink() {
  const { count } = useShopCart();
  return <Link className="cart-link" href="/checkout" aria-label={`Cart with ${count} items`}>Cart <span>{count}</span></Link>;
}

export function AddToCartButton({ product }: { product: CatalogueProduct }) {
  const { add } = useShopCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      className="add-cart-button"
      type="button"
      onClick={() => {
        add(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? 'Added to cart' : 'Add to cart'} <span aria-hidden="true">+</span>
    </button>
  );
}

export function ShopProductCard({ product }: { product: CatalogueProduct }) {
  const hasVerifiedPrice = product.status === 'verified' && typeof product.price === 'number';

  return (
    <article className="shop-product-card">
      <div className="product-code">{product.code}</div>
      <p className="catalogue-kicker">{product.family} · {product.form}</p>
      <h2>{product.name}</h2>
      <p>{product.summary}</p>
      <dl className="shop-specs">
        {product.specs.slice(0, 2).map((spec) => (
          <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>
        ))}
      </dl>
      <div className="product-footer">
        <strong>
          {hasVerifiedPrice ? `₦${product.price!.toLocaleString()}` : 'Price on request'}
          <small> / {product.sellingUnit.split('·')[0]}</small>
        </strong>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
