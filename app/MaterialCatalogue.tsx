'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { catalogueProducts, catalogueCategories, type CatalogueProduct, type StorefrontProduct } from './site-data';
import { ShopProductCard } from './ShopCart';

export function MaterialCatalogue({ mode = 'catalogue' }: { mode?: 'catalogue' | 'shop' }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [storefrontProducts, setStorefrontProducts] = useState<StorefrontProduct[]>([]);
  const [storefrontCategories, setStorefrontCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(mode === 'shop');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (mode !== 'shop') return;
    let cancelled = false;
    void fetch('/api/catalogue', { cache: 'no-store' }).then(async (response) => {
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof result !== 'object' || result === null || !('products' in result) || !Array.isArray(result.products)) {
        const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Catalogue is temporarily unavailable.';
        throw new Error(message);
      }
      const catalog = result as Record<string, unknown>;
      if (!cancelled) {
        setStorefrontProducts(catalog.products as StorefrontProduct[]);
        setStorefrontCategories(Array.isArray(catalog.categories) ? catalog.categories as typeof storefrontCategories : []);
        setLoadError('');
      }
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Catalogue is temporarily unavailable.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [mode]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalogueProducts.filter((product) => {
      const searchable = [product.name, product.family, product.form, product.summary, ...product.tags].join(' ').toLowerCase();
      return (!normalized || searchable.includes(normalized)) &&
        (category === 'all' || product.category === category) &&
        (!verifiedOnly || product.status === 'verified');
    });
  }, [category, query, verifiedOnly]);

  const storefrontResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return storefrontProducts.filter((product) => {
      const searchable = [product.name, product.sku, product.description, product.categoryName, JSON.stringify(product.attributes), ...product.variants.map((variant) => `${variant.name} ${variant.sku} ${variant.unit} ${JSON.stringify(variant.attributes)}`)].join(' ').toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (category === 'all' || product.categorySlug === category);
    });
  }, [category, query, storefrontProducts]);

  const resultCount = mode === 'shop' ? storefrontResults.length : results.length;

  return (
    <section className="catalogue-shell" aria-labelledby="catalogue-title">
      <div className="catalogue-intro">
        <div><p className="eyebrow">Structured catalogue</p><h2 id="catalogue-title">Start with the material. Specify the requirement.</h2></div>
        <p>{mode === 'shop' ? 'Browse products with current approved pricing and availability.' : 'Search by a product name or specification, then carry the selection into a project request. Availability and unverified attributes are confirmed before quotation.'}</p>
      </div>
      <div className="catalogue-toolbar">
        <label className="catalogue-search"><span className="sr-only">Search catalogue</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search steel, plywood, hinge, bolt…" /></label>
        <label className="catalogue-filter"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{(mode === 'shop' ? storefrontCategories.map(({ slug, name }) => ({ id: slug, name })) : catalogueCategories).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {mode !== 'shop' && <label className="verified-toggle"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /> <span>Verified fields only</span></label>}
      </div>
      <div className="catalogue-meta"><span>{loading ? 'Loading catalogue…' : `${resultCount} ${mode === 'shop' ? 'priced products' : resultCount === 1 ? 'catalogue entry' : 'catalogue entries'}`}</span><span>{mode === 'shop' ? 'Prices recalculated from approved rules' : 'Specifications confirmed per request'}</span></div>
      <div className="catalogue-results" aria-live="polite">
        {mode === 'shop' ? loading ? <p role="status">Loading products…</p> : loadError ? <p role="alert">{loadError}</p> : <div className="shop-product-grid">{storefrontResults.map((product) => <ShopProductCard product={product} key={product.id} />)}</div> : results.map((product) => <article className="catalogue-row" key={product.id}>
          <div className="catalogue-mark" aria-hidden="true">{product.code}</div>
          <div className="catalogue-result-copy"><div className="catalogue-result-heading"><div><p className="catalogue-kicker">{product.family} · {product.form}</p><h3>{product.name}</h3></div><span className={`status-pill status-${product.status}`}>{product.status === 'verified' ? 'Verified' : 'To confirm'}</span></div><p>{product.summary}</p><dl className="spec-list">{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl><div className="catalogue-row-actions"><Link href={`/project?material=${product.material}&item=${encodeURIComponent(product.name)}`}>Add to project</Link><span>{product.sellingUnit}</span></div></div>
        </article>)}
      </div>
      {!loading && !loadError && resultCount === 0 && <div className="catalogue-empty">{mode === 'shop' ? <><strong>No products are currently available for online purchase.</strong><p>Products appear here once their pricing and availability are verified.</p></> : <><strong>No matching catalogue entry yet.</strong><p>Tell us what you need and Qutlas will review a sourced or custom option.</p><Link className="primary-button" href="/project">Start a project</Link></>}</div>}
    </section>
  );
}

export default MaterialCatalogue;
