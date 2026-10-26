import { MaterialCatalogue } from '../MaterialCatalogue';

export default function ShopPage() {
  return <main className="shop-page"><div className="shop-hero"><h1>Find the exact part.<br /><em>Order it in a few clicks.</em></h1><p>Search fasteners, hardware and project materials by name, form or specification. Add what you need to a cart, review quantities and submit a complete order request.</p></div><MaterialCatalogue mode="shop" /></main>;
}
