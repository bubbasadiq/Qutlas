import Link from 'next/link';
import { services } from '../site-data';

export const metadata = {
  title: 'Services | Qutlas',
  description: 'Request material supply, cut-to-size work, custom manufacturing, and project sourcing.',
};

export default function ServicesPage() {
  return (
    <main className="listing-page">
      <div className="listing-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Services</span></nav><p className="eyebrow">How Qutlas can help</p><h1>One place to organise the requirement.</h1><p>Tell us what you need sourced or made. Scope, availability, processing, and timing are checked before quotation.</p></div>
      <div className="service-list">{services.map((service) => <Link href={`/services/${service.id}`} className="service-row" key={service.id}><span className="service-index">↗</span><div><h2>{service.name}</h2><p>{service.description}</p></div><span className="service-link">View service <span aria-hidden="true">→</span></span></Link>)}</div>
    </main>
  );
}