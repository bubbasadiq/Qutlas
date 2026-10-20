const materials = [
  { id: 'steel', name: 'Steel', description: 'From stock materials to cut-to-size parts and fabricated components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Mechanical_workshop.jpg/1280px-Mechanical_workshop.jpg', alt: 'Metal workshop with steel stock and fabrication benches.', detail: 'Sheet · plate · sections · bars · tubes' },
  { id: 'wood', name: 'Wood', description: 'Boards, panels, timber and made-to-measure wood components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Stack_of_wooden_planks_-_close-up_01.jpg/1280px-Stack_of_wooden_planks_-_close-up_01.jpg', alt: 'Stacked timber boards showing the wood grain.', detail: 'Boards · panels · timber · components' },
  { id: 'tiles', name: 'Tiles', description: 'Find the right tiles and quantities for your space or project.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Ceramic_tile_6858.jpg/1280px-Ceramic_tile_6858.jpg', alt: 'White ceramic wall tiles fitted around a kitchen backsplash.', detail: 'Floor · wall · wet areas · project supply' },
  { id: 'granite', name: 'Granite', description: 'Granite for surfaces, steps and other architectural finishes.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg/1280px-Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg', alt: 'Granite slabs secured on a truck for delivery.', detail: 'Countertops · steps · cut-to-size surfaces' },
];

const steps = [
  ['01', 'Tell us what you need', 'Choose a material, describe the job, or start with a drawing or photo.'],
  ['02', 'Set the details', 'Add dimensions, quantities, services, and the project location.'],
  ['03', 'Review your quote', 'Get the scope and price for your project to review.'],
  ['04', 'Move into production', 'Approve the confirmed job and Qutlas coordinates the agreed supply or making.'],
];

const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@qutlas.com';

export default function Home() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Qutlas home"><img src="/icon_logo.png" alt="Qutlas" /></a>
        <nav className="main-nav" aria-label="Main navigation"><a href="#materials">Materials</a><a href="#manufacturing">Custom manufacturing</a><a href="#how-it-works">How it works</a><a href="#business">For businesses</a></nav>
        <a className="header-action" href="/project">Start a project <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="hero-band" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow">Materials and making, together</p><h1 id="hero-title">Materials in.<br /><em>Possibilities out.</em></h1><p className="hero-intro">Source steel, wood, tiles and granite. Get materials cut to size, components fabricated, and project requirements supplied through one straightforward service.</p><div className="hero-actions"><a className="primary-button" href="/project">Start a project <span aria-hidden="true">↗</span></a><a className="text-action" href="#materials">Explore materials <span aria-hidden="true">↓</span></a></div><p className="hero-note">Start with a drawing, a material, or a simple description.</p></div>
          <figure className="hero-image"><img src={materials[0].image} alt={materials[0].alt} /><figcaption><span>Steelwork</span><span>Material to made-to-measure</span></figcaption></figure>
          <div className="hero-index" aria-hidden="true">Q / 01</div>
        </section>

        <section className="section materials-section" id="materials" aria-labelledby="materials-title">
          <div className="section-heading"><div><p className="eyebrow">Choose your starting point</p><h2 id="materials-title">What are you working with?</h2></div><p>Start with the material you need. We’ll help you work out the next step.</p></div>
          <div className="material-grid">{materials.map((material, index) => <a className={`material-card material-card-${material.id}`} href={`/project?material=${material.id}`} key={material.id}><div className="material-photo"><img src={material.image} alt={material.alt} loading={index > 1 ? 'lazy' : 'eager'} /><span className="material-number">0{index + 1}</span></div><div className="material-copy"><div className="material-title-row"><h3>{material.name}</h3><span aria-hidden="true">↗</span></div><p>{material.description}</p><small>{material.detail}</small><span className="material-link">Explore {material.name} <span aria-hidden="true">→</span></span></div></a>)}</div>
        </section>

        <section className="start-section" id="manufacturing" aria-labelledby="start-title">
          <div className="section-heading"><div><p className="eyebrow">No CAD required</p><h2 id="start-title">Start with what you have.</h2></div><p>Have a sketch or reference photo? Start there. You can add more details as you go.</p></div>
          <div className="start-grid"><a className="start-route" href="/project?startMode=drawing"><span className="route-icon" aria-hidden="true">01</span><div><h3>I have a design or drawing</h3><p>Upload your drawing or project files and tell us what you need made.</p></div><span className="route-action">Upload a design <span aria-hidden="true">↗</span></span></a><a className="start-route" href="/project?startMode=description"><span className="route-icon" aria-hidden="true">02</span><div><h3>I know what I need</h3><p>Describe the item, choose a material, add dimensions and quantity, and tell us where you need it.</p></div><span className="route-action">Describe your project <span aria-hidden="true">↗</span></span></a></div>
        </section>

        <section className="how-section section" id="how-it-works" aria-labelledby="how-title"><div className="how-intro"><p className="eyebrow">A clear next step</p><h2 id="how-title">From your requirement to the finished result.</h2><p>Share the information you have. Qutlas reviews the project before confirming scope, price, and timing.</p><a className="text-action" href="/project">Start a project <span aria-hidden="true">↗</span></a></div><ol className="steps-list">{steps.map(([number, title, description]) => <li key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section>

        <section className="applications-section section" aria-labelledby="applications-title"><div className="section-heading"><div><p className="eyebrow">For real work</p><h2 id="applications-title">From one component to a full project.</h2></div><p>For a single part, a space to fit out, a product to build, or materials for a larger job.</p></div><div className="applications-grid"><a href="/project?material=steel"><img src={materials[0].image} alt="Metal workshop with steel stock and fabrication benches." loading="lazy" /><span>Frames and components</span></a><a href="/project?material=wood"><img src={materials[1].image} alt="Timber boards for woodworking and building." loading="lazy" /><span>Wood panels and parts</span></a><a href="/project?material=tiles"><img src={materials[2].image} alt="White ceramic tile finish for building projects." loading="lazy" /><span>Tile supply for spaces</span></a><a href="/project?material=granite"><img src={materials[3].image} alt="Granite slabs secured on a truck for delivery." loading="lazy" /><span>Granite surfaces and steps</span></a></div></section>

        <section className="business-band" id="business" aria-labelledby="business-title"><div className="business-mark" aria-hidden="true">Q.</div><div className="business-copy"><p className="eyebrow">For contractors, workshops and teams</p><h2 id="business-title">A better way to source for your business.</h2><p>Managing materials and fabrication across projects takes time. Use one project request to organise the requirements, request a quote, and source the parts and materials for the job.</p></div><div className="business-actions"><a className="light-button" href="/project?startMode=idea">Start a business project <span aria-hidden="true">↗</span></a><a className="business-email" href={`mailto:${businessEmail}?subject=${encodeURIComponent('Business enquiry for Qutlas')}`}>Email {businessEmail}</a></div></section>

        <section className="final-cta section"><div><p className="eyebrow">Start anywhere</p><h2>What do you need to make?</h2><p>Start with a material, a drawing, or a simple description of your project.</p></div><div className="final-actions"><a className="primary-button" href="/project">Start a project <span aria-hidden="true">↗</span></a><a className="text-action" href="#materials">Explore materials <span aria-hidden="true">↑</span></a></div></section>
      </main>

      <footer className="site-footer"><a className="footer-brand" href="/" aria-label="Qutlas home"><img src="/icon_logo.png" alt="Qutlas" /></a><p>Materials in. Possibilities out.</p><nav aria-label="Footer navigation"><a href="#materials">Materials</a><a href="#manufacturing">Custom manufacturing</a><a href="#how-it-works">How it works</a><a href={`mailto:${businessEmail}?subject=${encodeURIComponent('Business enquiry for Qutlas')}`}>Business enquiries</a></nav><div className="footer-contact"><a href="mailto:support@qutlas.com">Quote support</a><a href={`mailto:${businessEmail}`}>{businessEmail}</a><small>Qutlas · Nigeria</small></div><p className="photo-credits"><span>Photography:</span> <a href="https://commons.wikimedia.org/wiki/File:Mechanical_workshop.jpg">Cjp24</a> (CC BY-SA 3.0), <a href="https://commons.wikimedia.org/wiki/File:Stack_of_wooden_planks_-_close-up_01.jpg">David r jenkins</a> (CC BY-SA 4.0), <a href="https://commons.wikimedia.org/wiki/File:Ceramic_tile_6858.jpg">Chris Light</a> (CC BY-SA 4.0), <a href="https://commons.wikimedia.org/wiki/File:Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg">Tomwsulcer</a> (CC0), via Wikimedia Commons.</p></footer>
    </>
  );
}