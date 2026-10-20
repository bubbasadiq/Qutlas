import Link from 'next/link';
import { resources } from '../site-data';

export const metadata = {
  title: 'Resources | Qutlas',
  description: 'Practical guidance for specifying materials and preparing project requests.',
};

export default function ResourcesPage() {
  return (
    <main className="listing-page">
      <div className="listing-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Resources</span></nav><p className="eyebrow">Helpful starting points</p><h1>Prepare a clearer project request.</h1><p>Use these guides to collect the details that help Qutlas understand a materials or manufacturing requirement.</p></div>
      <div className="resource-grid">{resources.map((resource, index) => <Link className="resource-card" href={resource.href} key={resource.href}><span>{String(index + 1).padStart(2, '0')}</span><h2>{resource.title}</h2><p>{resource.description}</p><b>Read guide <i aria-hidden="true">→</i></b></Link>)}</div>
    </main>
  );
}