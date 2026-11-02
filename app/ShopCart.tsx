'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { quantityToMicros } from './lib/pricing';
import type { StorefrontProduct, StorefrontVariant } from './site-data';
import styles from './commerce.module.css';

export type CartLine = {
  product: StorefrontProduct;
  variant: StorefrontVariant;
  quantity: string;
  subtotalMinor: string;
  taxMinor: string;
  totalMinor: string;
};

type PriceQuote = { currency: string; subtotalMinor: string; taxMinor: string; totalMinor: string };
type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalMinor: string | null;
  taxMinor: string | null;
  totalMinor: string | null;
  currency: string | null;
  error: string;
  add: (product: StorefrontProduct, variant: StorefrontVariant, quantity: string) => Promise<void>;
  update: (variantId: string, quantity: string) => Promise<void>;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CART_STORAGE_KEY = 'qutlas-commerce-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

export function formatMinorCurrency(minor: string, currency: string) {
  const amount = BigInt(minor);
  const formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 });
  const digits = new Intl.NumberFormat('en-NG', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const scale = 10n ** BigInt(digits);
  const whole = amount / scale;
  const fraction = amount % scale;
  const parts = formatter.formatToParts(whole);
  if (!digits) return parts.map((part) => part.value).join('');

  const decimal = new Intl.NumberFormat('en-NG').formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
  let lastNumberIndex = -1;
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index].type === 'integer' || parts[index].type === 'group') lastNumberIndex = index;
  }
  parts.splice(lastNumberIndex + 1, 0,
    { type: 'decimal', value: decimal },
    { type: 'fraction', value: fraction.toString().padStart(digits, '0') },
  );
  return parts.map((part) => part.value).join('');
}

async function getPrice(variantId: string, quantity: string): Promise<PriceQuote> {
  const response = await fetch('/api/pricing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId, quantity }),
    cache: 'no-store',
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof result !== 'object' || result === null) {
    throw new Error(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'This price is no longer available. Refresh the catalogue and try again.');
  }
  const data = result as Record<string, unknown>;
  if (typeof data.currency !== 'string' || typeof data.subtotalMinor !== 'string' || typeof data.taxMinor !== 'string' || typeof data.totalMinor !== 'string') {
    throw new Error('The pricing service returned an invalid result.');
  }
  return { currency: data.currency, subtotalMinor: data.subtotalMinor, taxMinor: data.taxMinor, totalMinor: data.totalMinor };
}

function sumLines(lines: CartLine[], field: 'subtotalMinor' | 'taxMinor' | 'totalMinor') {
  if (!lines.length || new Set(lines.map((line) => line.variant.price.currency)).size !== 1) return null;
  return lines.reduce((sum, line) => sum + BigInt(line[field]), 0n).toString();
}

async function restoreCart(): Promise<CartLine[]> {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(saved) || !saved.length) return [];
    const response = await fetch('/api/catalogue', { cache: 'no-store' });
    if (!response.ok) return [];
    const catalog: unknown = await response.json();
    if (typeof catalog !== 'object' || catalog === null || !('products' in catalog) || !Array.isArray(catalog.products)) return [];
    const products = catalog.products as StorefrontProduct[];
    const variants = new Map<string, { product: StorefrontProduct; variant: StorefrontVariant }>();
    for (const product of products) for (const variant of product.variants) variants.set(variant.id, { product, variant });

    const restored: CartLine[] = [];
    for (const entry of saved.slice(0, 30)) {
      if (typeof entry !== 'object' || entry === null || !('variantId' in entry) || !('quantity' in entry) ||
        typeof entry.variantId !== 'string' || typeof entry.quantity !== 'string') continue;
      const current = variants.get(entry.variantId);
      if (!current) continue;
      try {
        const price = await getPrice(entry.variantId, entry.quantity);
        restored.push({ ...current, quantity: entry.quantity, ...price });
      } catch {
        continue;
      }
    }
    return restored;
  } catch {
    return [];
  }
}

function quantityFromMicros(value: bigint) {
  const whole = value / 1_000_000n;
  const remainder = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return remainder ? `${whole}.${remainder}` : whole.toString();
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void restoreCart().then((restored) => {
      if (cancelled) return;
      setLines(restored);
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines.map(({ variant, quantity }) => ({ variantId: variant.id, quantity }))));
    } catch {
      // The cart remains usable for this page session when browser storage is blocked.
    }
  }, [hydrated, lines]);

  const add = async (product: StorefrontProduct, variant: StorefrontVariant, quantity: string) => {
    setError('');
    try {
      const existing = lines.find((line) => line.variant.id === variant.id);
      const nextQuantity = existing
        ? quantityFromMicros(quantityToMicros(existing.quantity) + quantityToMicros(quantity))
        : quantity;
      const price = await getPrice(variant.id, nextQuantity);
      setLines((current) => [...current.filter((line) => line.variant.id !== variant.id), { product, variant, quantity: nextQuantity, ...price }]);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'This item could not be added.');
      throw addError;
    }
  };

  const update = async (variantId: string, quantity: string) => {
    if (!quantity.trim() || quantity === '0') {
      setLines((current) => current.filter((line) => line.variant.id !== variantId));
      return;
    }
    const line = lines.find((item) => item.variant.id === variantId);
    if (!line) return;
    setError('');
    try {
      const price = await getPrice(variantId, quantity);
      setLines((current) => current.map((item) => item.variant.id === variantId ? { ...item, quantity, ...price } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The quantity could not be priced.');
    }
  };

  const remove = (variantId: string) => setLines((current) => current.filter((line) => line.variant.id !== variantId));
  const count = lines.length;
  const currencies = new Set(lines.map((line) => line.variant.price.currency));
  const currency = currencies.size === 1 ? lines[0]?.variant.price.currency ?? null : null;
  const subtotalMinor = useMemo(() => sumLines(lines, 'subtotalMinor'), [lines]);
  const taxMinor = useMemo(() => sumLines(lines, 'taxMinor'), [lines]);
  const totalMinor = useMemo(() => sumLines(lines, 'totalMinor'), [lines]);

  return <CartContext.Provider value={{ lines, count, subtotalMinor, taxMinor, totalMinor, currency, error, add, update, remove, clear: () => setLines([]) }}>{children}</CartContext.Provider>;
}

export function useShopCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useShopCart must be used inside ShopCartProvider');
  return value;
}

export function CartLink() {
  const { count } = useShopCart();
  return <Link className="cart-link" href="/checkout" aria-label={`Cart with ${count} product variants`}>Cart <span>{count}</span></Link>;
}

export function AddToCartButton({ product, variant, quantity }: { product: StorefrontProduct; variant: StorefrontVariant; quantity: string }) {
  const { add } = useShopCart();
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div className={styles.addCartAction}><button className="add-cart-button" type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    setError('');
    try {
      await add(product, variant, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1400);
    } catch (addError) {
      setAdded(false);
      setError(addError instanceof Error ? addError.message : 'Price could not be verified.');
    } finally {
      setBusy(false);
    }
  }}>{busy ? 'Checking price…' : added ? 'Added to cart' : 'Add to cart'} <span aria-hidden="true">+</span></button>{error && <small role="alert">{error}</small>}</div>;
}

export function ShopProductCard({ product }: { product: StorefrontProduct }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const [quantity, setQuantity] = useState(variant?.minimumQuantity ?? '1');
  const details = [...Object.entries(product.attributes), ...(variant ? Object.entries(variant.attributes) : [])];
  if (!variant) return null;

  return <article className="shop-product-card">
    <div className="product-code">{product.sku}</div>
    <p className="catalogue-kicker">{product.categoryName} · {variant.name}</p>
    <h2>{product.name}</h2>
    <p>{product.description}</p>
    {product.variants.length > 1 && <label className={styles.variantSelect}>Specification<select value={variantId} onChange={(event) => {
      setVariantId(event.target.value);
      const next = product.variants.find((item) => item.id === event.target.value);
      setQuantity(next?.minimumQuantity ?? '1');
    }}>{product.variants.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>}
    {!!details.length && <dl className="shop-specs">{details.slice(0, 6).map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, ' ')}</dt><dd>{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl>}
    <div className="product-footer"><strong>{formatMinorCurrency(variant.price.totalMinor, variant.price.currency)}<small> minimum order: {variant.minimumQuantity} {variant.unit}</small></strong>
      <label className={styles.quantitySelect}>Quantity<input type="number" min={variant.minimumQuantity} max={variant.maximumQuantity ?? undefined} step={variant.quantityStep} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      <AddToCartButton product={product} variant={variant} quantity={quantity} />
    </div>
  </article>;
}
