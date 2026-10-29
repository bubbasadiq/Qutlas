import Link from 'next/link';

const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@qutlas.com';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-brand" href="/" aria-label="Qutlas home"><img src="/icon_logo.png" alt="Qutlas" /></Link>
      <p>Materials in. Possibilities out.</p>
      <nav aria-label="Footer navigation">
        <Link href="/materials">Materials</Link><Link href="/shop">Shop</Link><Link href="/project">Make a project</Link><Link href="/qutters-lab">Qutters Lab</Link><Link href="/resources">Resources</Link><Link href="/business">For business</Link><Link href="/about">About</Link>
      </nav>
      <div className="footer-contact"><a href="mailto:support@qutlas.com">Quote support</a><a href={`mailto:${businessEmail}`}>{businessEmail}</a><small>Materials · parts · making</small></div>
      <p className="photo-credits"><span>Photography:</span> <a href="https://commons.wikimedia.org/wiki/File:Mechanical_workshop.jpg">Cjp24</a> (CC BY-SA 3.0), <a href="https://commons.wikimedia.org/wiki/File:Stack_of_wooden_planks_-_close-up_01.jpg">David r jenkins</a> (CC BY-SA 4.0), <a href="https://commons.wikimedia.org/wiki/File:Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg">Tomwsulcer</a> (CC0), via Wikimedia Commons.</p>
    </footer>
  );
}