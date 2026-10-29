import Link from 'next/link';
import LabInterestForms from './LabInterestForms';

export const metadata = {
  title: 'Qutters Lab | Qutlas',
  description: 'A Qutlas lab-space concept for hubs and institutions, built around practical learning, experimentation and making.',
};

const labPillars = [
  { number: '01', title: 'Learn by doing', text: 'Explore ideas through practical work, guided experimentation and hands-on projects.' },
  { number: '02', title: 'Prototype and test', text: 'Move from a sketch or concept towards a model, component or working prototype.' },
  { number: '03', title: 'Build with others', text: 'Connect learners, makers, educators and technical communities around shared challenges.' },
];

export default function QuttersLabPage() {
  return <main className="qutters-lab-page">
    <section className="lab-hero"><div className="lab-hero-copy"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Qutters Lab</span></nav><p className="eyebrow">A Qutlas programme</p><h1>A place to turn<br />curiosity into <em>capability.</em></h1><p>Qutters Lab is a lab-space concept designed to come to hubs and institutions. It is a place for practical learning, prototyping, experimentation and the confidence to make real things.</p><div className="lab-hero-actions"><a className="primary-button" href="#host">Explore hosting a lab <span aria-hidden="true">↗</span></a><a className="text-action" href="#participate">I want to take part <span aria-hidden="true">↓</span></a></div><p className="lab-status-note">Qutters Lab is a developing concept. Locations, facilities and programme availability will be confirmed as partnerships progress.</p></div><div className="lab-hero-image"><img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=85" alt="A person working with a technical prototype at a workbench." /></div></section>
    <section className="lab-purpose section"><div className="section-heading"><div><p className="eyebrow">The idea</p><h2>Make practical work part of learning.</h2></div><p>Access to a place to experiment can help people develop technical confidence, test ideas and learn by building, not only by reading about how things work.</p></div><div className="lab-pillars">{labPillars.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    <section className="lab-audiences"><div><p className="eyebrow">Designed to work with</p><h2>Hubs, institutions and the people who build.</h2></div><ul><li>Universities and colleges</li><li>Technical and vocational institutions</li><li>Innovation hubs and maker communities</li><li>Students, engineers, designers and inventors</li><li>Partners interested in practical skills and prototyping</li></ul></section>
    <section className="lab-host-cta"><p className="eyebrow">Bring a lab to your community</p><h2>Could your institution host a Qutters Lab?</h2><p>We are interested in hearing from institutions and hubs that want to explore the concept, the space, the community and the partnership required to make it work.</p><a className="primary-button" href="#host">Register hosting interest <span aria-hidden="true">↗</span></a></section>
    <section className="lab-interest-section section"><div className="section-heading"><div><p className="eyebrow">Start a conversation</p><h2>Host a lab or get involved.</h2></div><p>Choose the path that fits you. These are interface previews; submission and storage will be connected in the backend phase.</p></div><LabInterestForms /></section>
  </main>;
}
