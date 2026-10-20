import Link from 'next/link';

type ContentSection = {
  title: string;
  body: string;
  items?: string[];
};

export default function ContentPage({
  eyebrow,
  title,
  description,
  sections,
  action = 'Start a project',
  actionHref = '/project',
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: ContentSection[];
  action?: string;
  actionHref?: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <main className="content-page">
      <section className="content-hero">
        <div className="content-hero-copy">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="content-intro">{description}</p>
          <Link className="primary-button" href={actionHref}>{action}<span aria-hidden="true">↗</span></Link>
        </div>
        {image && <img className="content-hero-image" src={image} alt={imageAlt ?? ''} />}
      </section>
      <div className="content-sections">
        {sections.map((section, index) => (
          <section className="content-section" key={section.title}>
            <span className="content-section-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div><h2>{section.title}</h2><p>{section.body}</p>{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</div>
          </section>
        ))}
      </div>
      <div className="content-end"><p>Ready to get started?</p><Link className="text-action" href={actionHref}>{action}<span aria-hidden="true">↗</span></Link></div>
    </main>
  );
}