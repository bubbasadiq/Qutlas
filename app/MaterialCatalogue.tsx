'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { catalogueProducts, catalogueCategories, type CatalogueProduct } from './site-data';
import { ShopProductCard } from './ShopCart';

export function MaterialCatalogue({ mode = 'catalogue' }: { mode?: 'catalogue' | 'shop' }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalogueProducts.filter((product) => {
      const searchable = [product.name, product.family, product.form, product.summary, ...product.tags].join(' ').toLowerCase();
      return (!normalized || searchable.includes(normalized)) &&
        (category === 'all' || product.category === category) &&
        (!verifiedOnly || product.status === 'verified');
    });
  }, [category, query, verifiedOnly]);

  return (
    <section className="catalogue-shell" aria-labelledby="catalogue-title">
      <div className="catalogue-intro">
        <div><p className="eyebrow">Structured catalogue</p><h2 id="catalogue-title">Start with the material. Specify the requirement.</h2></div>
        <p>{mode === 'shop' ? 'Explore available material forms and specifications. Add a requirement to your project or request confirmation before ordering.' : 'Search by a product name or specification, then carry the selection into a project request. Availability, price and unverified attributes are confirmed before quotation.'}</p>
      </div>
      <div className="catalogue-toolbar">
        <label className="catalogue-search"><span className="sr-only">Search catalogue</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search steel, plywood, hinge, bolt…" /></label>
        <label className="catalogue-filter"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{catalogueCategories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label className="verified-toggle"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /> <span>Verified fields only</span></label>
      </div>
      <div className="catalogue-meta"><span>{results.length} catalogue {results.length === 1 ? 'entry' : 'entries'}</span><span>Specifications and availability confirmed per request</span></div>
      <div className="catalogue-results" aria-live="polite">
        {mode === 'shop' ? <div className="shop-product-grid">{results.map((product) => <ShopProductCard product={product} key={product.id} />)}</div> : results.map((product) => <article className="catalogue-row" key={product.id}>
          <div className="catalogue-mark" aria-hidden="true">{product.code}</div>
          <div className="catalogue-result-copy"><div className="catalogue-result-heading"><div><p className="catalogue-kicker">{product.family} · {product.form}</p><h3>{product.name}</h3></div><span className={`status-pill status-${product.status}`}>{product.status === 'verified' ? 'Verified' : 'To confirm'}</span></div><p>{product.summary}</p><dl className="spec-list">{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl><div className="catalogue-row-actions"><Link href={`/project?material=${product.material}&item=${encodeURIComponent(product.name)}`}>Add to project <span aria-hidden="true">↗</span></Link><span>{product.sellingUnit}</span></div></div>
        </article>)}
      </div>
      {!results.length && <div className="catalogue-empty"><strong>No matching catalogue entry yet.</strong><p>Tell us what you need and Qutlas will review a sourced or custom option.</p><Link className="primary-button" href="/project">Request help <span aria-hidden="true">↗</span></Link></div>}
    </section>
  );
}

export default MaterialCatalogue;
