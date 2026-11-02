import { MaterialCatalogue } from '../MaterialCatalogue';
import Link from 'next/link';

export const metadata = {
  title: 'Shop materials | Qutlas',
  description: 'Explore steel, wood and granite forms and request the specifications you need.',
};

export default function ShopPage() {
  return <main className="shop-page"><div className="shop-hero"><p className="eyebrow">Materials and components</p><h1>Choose a product.<br /><em>See its price now.</em></h1><p>Browse products with current approved pricing, select a verified specification, and set your quantity. Prices and stock are checked again at checkout.</p><div className="shop-hero-actions"><a className="primary-button" href="#catalogue-title">Browse priced products</a><Link className="text-action" href="/materials">Explore material guides</Link></div></div><MaterialCatalogue mode="shop" /></main>;
}
