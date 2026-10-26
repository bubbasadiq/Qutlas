'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { materials, resources, services } from './site-data';
import { CartLink } from './ShopCart';

type MenuName = 'materials' | 'services' | 'resources' | 'mobile' | null;

export default function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<MenuName>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const mobileWasOpen = Boolean(headerRef.current?.querySelector('#mobile-navigation'));
        setOpenMenu(null);
        if (mobileWasOpen) mobileToggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const toggle = (menu: Exclude<MenuName, null | 'mobile'>) => setOpenMenu((current) => current === menu ? null : menu);
  const close = () => setOpenMenu(null);

  return (
    <header className="site-header" ref={headerRef}>
      <Link className="brand" href="/" aria-label="Qutlas home" onClick={close}><img src="/icon_logo.png" alt="Qutlas" /></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <div className="nav-group">
          <button type="button" className="nav-trigger" aria-expanded={openMenu === 'materials'} aria-controls="materials-menu" onClick={() => toggle('materials')}>Materials <span aria-hidden="true">⌄</span></button>
          {openMenu === 'materials' && <div className="nav-popover" id="materials-menu">{materials.map((material) => <Link href={`/materials/${material.id}`} key={material.id} onClick={close}>{material.name}<small>{material.detail}</small></Link>)}<Link className="popover-all" href="/materials" onClick={close}>Browse all materials</Link></div>}
        </div>
        <div className="nav-group">
          <button type="button" className="nav-trigger" aria-expanded={openMenu === 'services'} aria-controls="services-menu" onClick={() => toggle('services')}>Services <span aria-hidden="true">⌄</span></button>
          {openMenu === 'services' && <div className="nav-popover" id="services-menu">{services.map((service) => <Link href={`/services/${service.id}`} key={service.id} onClick={close}>{service.name}<small>{service.description}</small></Link>)}<Link className="popover-all" href="/services" onClick={close}>All services</Link></div>}
        </div>
        <div className="nav-group">
          <button type="button" className="nav-trigger" aria-expanded={openMenu === 'resources'} aria-controls="resources-menu" onClick={() => toggle('resources')}>Resources <span aria-hidden="true">⌄</span></button>
          {openMenu === 'resources' && <div className="nav-popover" id="resources-menu">{resources.map((resource) => <Link href={resource.href} key={resource.href} onClick={close}>{resource.title}<small>{resource.description}</small></Link>)}</div>}
        </div>
        <Link href="/business" onClick={close}>For business</Link>
        <Link href="/about" onClick={close}>About</Link>
      </nav>
      <CartLink /><Link className="header-action" href="/project" onClick={close}>Start a project <span aria-hidden="true">↗</span></Link>
      <button ref={mobileToggleRef} type="button" className={`mobile-menu-toggle ${openMenu === 'mobile' ? 'open' : ''}`} aria-label={openMenu === 'mobile' ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={openMenu === 'mobile'} aria-controls="mobile-navigation" onClick={() => setOpenMenu((current) => current === 'mobile' ? null : 'mobile')}><span></span><span></span><span></span></button>
      {openMenu === 'mobile' && <nav className="mobile-navigation" id="mobile-navigation" aria-label="Mobile navigation">
        <details><summary>Materials</summary><div>{materials.map((material) => <Link href={`/materials/${material.id}`} key={material.id} onClick={close}>{material.name}</Link>)}<Link href="/materials" onClick={close}>Browse all materials</Link></div></details>
        <details><summary>Services</summary><div>{services.map((service) => <Link href={`/services/${service.id}`} key={service.id} onClick={close}>{service.name}</Link>)}<Link href="/services" onClick={close}>All services</Link></div></details>
        <details><summary>Resources</summary><div>{resources.map((resource) => <Link href={resource.href} key={resource.href} onClick={close}>{resource.title}</Link>)}</div></details>
        <Link href="/business" onClick={close}>For business</Link>
        <Link href="/about" onClick={close}>About</Link>
        <Link className="mobile-start" href="/project" onClick={close}>Start a project ↗</Link>
      </nav>}
    </header>
  );
}
