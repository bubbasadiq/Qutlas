import { MaterialCatalogue } from '../MaterialCatalogue';

export const metadata = {
  title: 'Shop materials | Qutlas',
  description: 'Explore steel, wood and granite forms and request the specifications you need.',
};

export default function ShopPage() {
  return <main className="shop-page"><div className="shop-hero"><p className="eyebrow">Materials and components</p><h1>Find your material.<br /><em>Work out the right spec.</em></h1><p>Explore steel, wood and granite. Search by form or specification, then carry your selection into a project request. Price, quality and availability are confirmed before an order is accepted.</p><div className="shop-hero-actions"><a className="primary-button" href="/project">Describe what you need <span aria-hidden="true">↗</span></a><a className="text-action" href="/materials">Browse materials <span aria-hidden="true">→</span></a></div></div><MaterialCatalogue mode="shop" /></main>;
}
