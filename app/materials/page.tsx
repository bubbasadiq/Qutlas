import Link from 'next/link';
import { materials } from '../site-data';
import MaterialCatalogue from '../MaterialCatalogue';

export const metadata = {
  title: 'Materials | Qutlas',
  description: 'Browse steel, wood, and granite project requests through Qutlas.',
};

export default function MaterialsPage() {
  return (
    <main className="listing-page">
      <div className="listing-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Materials</span></nav><p className="eyebrow">Explore materials</p><h1>Choose what your project needs.</h1><p>Start with a material. Add the details you know and ask us to review the rest.</p></div>
      <div className="material-grid">{materials.map((material) => <Link className={`material-card material-card-${material.id}`} href={`/materials/${material.id}`} key={material.id}><div className="material-photo"><img src={material.image} alt={material.alt} /><span className="material-number">↗</span></div><div className="material-copy"><div className="material-title-row"><h2>{material.name}</h2><span aria-hidden="true">→</span></div><p>{material.description}</p><small>{material.detail}</small><span className="material-link">Browse forms <span aria-hidden="true">↗</span></span></div></Link>)}</div>
      <MaterialCatalogue />
    </main>
  );
}
