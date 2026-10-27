import Link from 'next/link';

const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@qutlas.com';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-brand" href="/" aria-label="Qutlas home"><img src="/icon_logo.png" alt="Qutlas" /></Link>
      <p>Materials in. Possibilities out.</p>
      <nav aria-label="Footer navigation">
        <Link href="/materials">Materials</Link><Link href="/services">Services</Link><Link href="/resources">Resources</Link><Link href="/business">For business</Link><Link href="/about">About</Link>
      </nav>
      <div className="footer-contact"><a href="mailto:support@qutlas.com">Quote support</a><a href={`mailto:${businessEmail}`}>{businessEmail}</a><small>Qutlas · Nigeria</small></div>
    </footer>
  );
}
