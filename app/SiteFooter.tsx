import Link from 'next/link';

const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@qutlas.com';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-brand" href="/" aria-label="Qutlas home"><img src="/icon_logo.png" alt="Qutlas" /></Link>
      <nav aria-label="Footer navigation">
        <Link href="/materials">Materials</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/project">Make a project</Link>
        <Link href="/qutters-lab">Qutters Lab</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/business">For business</Link>
        <Link href="/about">About</Link>
      </nav>
      <div className="footer-contact"><a href={`mailto:${businessEmail}`}>{businessEmail}</a></div>
    </footer>
  );
}
