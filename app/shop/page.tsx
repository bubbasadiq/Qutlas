import { MaterialCatalogue } from '../MaterialCatalogue';

export default function ShopPage() {
  return <main className="shop-page"><div className="shop-hero"><p className="eyebrow">Qutlas hardware counter</p><h1>Find the right part.<br /><em>Request a quote.</em></h1><p>Search fasteners, hardware and project materials by name, form or specification. Build a list of what you need and submit one request for availability, pricing and delivery confirmation.</p></div><MaterialCatalogue mode="shop" /></main>;
}
