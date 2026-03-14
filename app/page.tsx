'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const curRingRef = useRef<HTMLDivElement>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x2b2f8c, 0.1);

    camera.position.z = 5;

    // Create a simple network visualization
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const nodeCount = 12;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 3;
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 2 - 1
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    const material = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.15,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Create connecting lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle1 = (i / nodeCount) * Math.PI * 2;
      const angle2 = ((i + 1) % nodeCount / nodeCount) * Math.PI * 2;
      const radius = 3;

      linePositions.push(
        Math.cos(angle1) * radius,
        Math.sin(angle1) * radius,
        0
      );
      linePositions.push(
        Math.cos(angle2) * radius,
        Math.sin(angle2) * radius,
        0
      );
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      points.rotation.z += 0.0005;
      lines.rotation.z += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.r').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 50) {
          navRef.current.classList.add('scrolled');
        } else {
          navRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile menu
  useEffect(() => {
    const hamburger = hamburgerRef.current;
    const mobileMenu = mobileMenuRef.current;

    const toggleMenu = () => {
      mobileMenu?.classList.toggle('open');
    };

    hamburger?.addEventListener('click', toggleMenu);

    const links = mobileMenu?.querySelectorAll('a');
    links?.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });

    return () => {
      hamburger?.removeEventListener('click', toggleMenu);
    };
  }, []);

  // Custom cursor
  useEffect(() => {
    const cur = curRef.current;
    const curRing = curRingRef.current;

    const updateCursor = (e: MouseEvent) => {
      if (cur && curRing) {
        cur.style.left = e.clientX + 'px';
        cur.style.top = e.clientY + 'px';
        curRing.style.left = e.clientX + 'px';
        curRing.style.top = e.clientY + 'px';
      }
    };

    const addHoverState = () => {
      document.body.classList.add('hovering');
    };

    const removeHoverState = () => {
      document.body.classList.remove('hovering');
    };

    window.addEventListener('mousemove', updateCursor);

    const hoverElements = document.querySelectorAll('a, button, input, select, textarea');
    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', addHoverState);
      el.addEventListener('mouseleave', removeHoverState);
    });

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      hoverElements.forEach((el) => {
        el.removeEventListener('mouseenter', addHoverState);
        el.removeEventListener('mouseleave', removeHoverState);
      });
    };
  }, []);

  return (
    <>
      <div id="cur" ref={curRef}></div>
      <div id="cur-ring" ref={curRingRef}></div>

      {/* Nav */}
      <nav id="nav" ref={navRef}>
        <a href="#" className="nav-logo">
          <img src="/icon_logo.png" alt="Qutlas" />
        </a>
        <ul className="nav-links">
          <li>
            <a href="#problem">The Problem</a>
          </li>
          <li>
            <a href="#platform">Platform</a>
          </li>
          <li>
            <a href="#basalt">First Material</a>
          </li>
          <li>
            <a href="#contact" className="nav-cta">
              Get in Touch
            </a>
          </li>
        </ul>
        <button className="hamburger" id="hamburger" ref={hamburgerRef} aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className="mobile-menu" id="mobileMenu" ref={mobileMenuRef}>
        <a href="#problem" className="mob-link">
          The Problem
        </a>
        <a href="#platform" className="mob-link">
          Platform
        </a>
        <a href="#basalt" className="mob-link">
          First Material
        </a>
        <a href="#contact" className="mob-link">
          Get in Touch
        </a>
      </div>

      {/* Hero */}
      <section id="hero">
        <canvas id="hero-canvas" ref={canvasRef}></canvas>
        <div id="hero-labels"></div>
        <div className="hero-inner">
          <div className="hero-blur">
            <div className="h-eye">Programmable Materials Manufacturing</div>
            <h1 className="h-title">
              Matter, finally
              <br />
              <em>under instruction.</em>
            </h1>
            <p className="h-body">
              For decades, the way we make structural materials has not fundamentally changed. We are building the
              infrastructure to change that, one material at a time.
            </p>
            <div className="h-actions">
              <a href="#platform" className="btn-primary">
                See the Platform
              </a>
              <a href="#contact" className="btn-ghost">
                Request a conversation
              </a>
            </div>
          </div>
        </div>
        <div className="hero-live">
          <span className="live-dot"></span>
          MANUFACTURING LOOP · LIVE
        </div>
      </section>

      <div className="div-line"></div>

      {/* Problem */}
      <section id="problem" className="s">
        <div className="si">
          <div className="prob-top">
            <div className="r">
              <div className="eye">The Problem</div>
              <h2 className="d">
                The factory floor has not changed.
                <br />
                Everything around it <em>has.</em>
              </h2>
            </div>
            <div className="r d2">
              <p className="lead">
                Industries now require materials engineered to precise specifications. Aerospace, telecommunications,
                robotics: each demands something different. The production systems supplying them still operate on
                parameters set decades ago.
              </p>
              <div className="prob-stats">
                <div>
                  <div className="ps-n">Decades</div>
                  <div className="ps-l">Without fundamental change</div>
                </div>
                <div>
                  <div className="ps-n">Years</div>
                  <div className="ps-l">To develop one new material grade</div>
                </div>
              </div>
            </div>
          </div>
          <div className="prob-grid">
            <div className="pc r d1">
              <div className="pc-bar"></div>
              <div className="pc-n">01</div>
              <h3>Fixed from the start</h3>
              <p>
                Temperature, pressure, draw speed: set once, rarely revisited. The process was designed for stability,
                not for the ability to respond.
              </p>
            </div>
            <div className="pc r d2">
              <div className="pc-bar"></div>
              <div className="pc-n">02</div>
              <h3>One factory, one grade</h3>
              <p>
                Every new material variant requires rebuilding the process from scratch. What takes months in software
                takes years in matter.
              </p>
            </div>
            <div className="pc r d3">
              <div className="pc-bar"></div>
              <div className="pc-n">03</div>
              <h3>Variability has nowhere to go</h3>
              <p>
                Natural feedstocks shift in composition from batch to batch. Current systems absorb that variation as
                inconsistency rather than compensating for it.
              </p>
            </div>
            <div className="pc r d4">
              <div className="pc-bar"></div>
              <div className="pc-n">04</div>
              <h3>No loop between idea and material</h3>
              <p>
                Software has a development cycle. Materials manufacturing does not. That absence is what Qutlas is
                built to address.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="div-line"></div>

      {/* Platform */}
      <section id="platform" className="s">
        <div className="si">
          <div className="r">
            <div className="eye">The Platform</div>
            <h2 className="d">
              Five layers. One closed loop.
              <br />
              <em>One line. Many materials.</em>
            </h2>
            <p className="lead">
              The system does not run a recipe. It observes the process, predicts the outcome, and steers the result.
              Continuously, in real time.
            </p>
          </div>
          <div className="plat-layout">
            <div className="r d1">
              <div id="schematic-wrap">
                <svg id="schematic-svg" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ffaa00" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect width="600" height="450" fill="#080c22" />
                  <circle cx="300" cy="225" r="150" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.2" />
                  <circle cx="300" cy="225" r="100" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.15" />
                  <circle cx="300" cy="225" r="50" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.1" />
                  <circle cx="300" cy="225" r="10" fill="#ffaa00" opacity="0.8" />
                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (i / 5) * Math.PI * 2;
                    const x = 300 + Math.cos(angle) * 120;
                    const y = 225 + Math.sin(angle) * 120;
                    return (
                      <g key={i}>
                        <line x1="300" y1="225" x2={x} y2={y} stroke="#ffaa00" strokeWidth="1" opacity="0.3" />
                        <circle cx={x} cy={y} r="6" fill="#ffaa00" opacity="0.6" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            <div className="plat-layers r d2">
              <div className="pl active">
                <div className="pl-n">01</div>
                <div>
                  <div className="pl-bar"></div>
                  <div className="pl-name">Sensing</div>
                  <div className="pl-desc">Real-time data from process sensors feeds the system continuously.</div>
                </div>
              </div>
              <div className="pl">
                <div className="pl-n">02</div>
                <div>
                  <div className="pl-bar"></div>
                  <div className="pl-name">Modeling</div>
                  <div className="pl-desc">Physics and machine learning predict the outcome in real time.</div>
                </div>
              </div>
              <div className="pl">
                <div className="pl-n">03</div>
                <div>
                  <div className="pl-bar"></div>
                  <div className="pl-name">Control</div>
                  <div className="pl-desc">The system adjusts parameters to hit the target specification.</div>
                </div>
              </div>
              <div className="pl">
                <div className="pl-n">04</div>
                <div>
                  <div className="pl-bar"></div>
                  <div className="pl-name">Learning</div>
                  <div className="pl-desc">Each run improves the model for the next material or batch.</div>
                </div>
              </div>
              <div className="pl">
                <div className="pl-n">05</div>
                <div>
                  <div className="pl-bar"></div>
                  <div className="pl-name">Deployment</div>
                  <div className="pl-desc">New materials reach production in days, not years.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="plat-bottom">
            <div className="plat-line">
              The feedback loop is <em>closed</em>. The learning is <em>continuous</em>. The time from idea to material
              is <em>measured in days.</em>
            </div>
          </div>
        </div>
      </section>

      <div className="div-line"></div>

      {/* Basalt */}
      <section id="basalt" className="s">
        <div className="si">
          <div className="bas-layout">
            <div className="r">
              <div className="eye">First Material</div>
              <h2 className="d">
                Basalt fiber, <em>reimagined.</em>
              </h2>
              <div className="bas-text">
                <p>
                  We are launching with basalt fiber—one of the strongest, most durable materials known. It has been
                  used in aerospace and high-performance applications for decades.
                </p>
                <p>
                  Until now, it could only be made one way. Our first material variant optimizes for a specific set of
                  mechanical properties that aerospace manufacturers have been requesting for years.
                </p>
                <p>
                  This is just the beginning. The platform enables us to optimize basalt for thermal resistance, impact
                  absorption, weight reduction, cost, or any specification an industry requires.
                </p>
              </div>
            </div>
            <div className="bas-classes r d1">
              <div className="bc">
                <div className="bc-name">Standard Grade</div>
                <div className="bc-arrow">→</div>
                <div className="bc-tag">Baseline</div>
              </div>
              <div className="bc">
                <div className="bc-name">High-Strength Variant</div>
                <div className="bc-arrow">→</div>
                <div className="bc-tag">Custom</div>
              </div>
              <div className="bc">
                <div className="bc-name">Thermal-Optimized</div>
                <div className="bc-arrow">→</div>
                <div className="bc-tag">Custom</div>
              </div>
              <div className="bc">
                <div className="bc-name">Impact-Resistant</div>
                <div className="bc-arrow">→</div>
                <div className="bc-tag">Custom</div>
              </div>
              <div className="bc">
                <div className="bc-name">Cost-Optimized</div>
                <div className="bc-arrow">→</div>
                <div className="bc-tag">Custom</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="div-line"></div>

      {/* Vision */}
      <section id="vision">
        <div className="vis-wedge">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 100 L 200 0 L 200 200 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="vis-inner">
          <h2 className="vis-q">
            What if <em>every</em> material could be programmed?
          </h2>
          <p className="vis-sub">
            Metals, composites, ceramics, polymers—the same closed-loop system applies to all of them. The factory
            becomes a platform. Engineers specify what they need. We deliver it.
          </p>
          <a href="#contact" className="btn-navy-outline">
            Let's talk
          </a>
        </div>
      </section>

      <div className="div-line"></div>

      {/* Contact */}
      <section id="contact" className="s">
        <div className="si">
          <div className="con-layout">
            <div className="con-left r">
              <div className="eye">Get in Touch</div>
              <h2 className="d">
                We are actively looking for partners and early customers to shape the future of materials manufacturing
                with us.
              </h2>
              <p style={{ fontSize: '0.97rem', color: 'var(--dim)', lineHeight: '1.85', marginTop: '2rem' }}>
                Whether you represent an aerospace manufacturer, a materials distributor, or an industry exploring new
                possibilities, we'd like to hear from you.
              </p>
            </div>
            <form className="con-form r d1">
              <div className="ff">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="ff">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="ff">
                <label htmlFor="company">Company / Organization</label>
                <input type="text" id="company" name="company" required />
              </div>
              <div className="ff">
                <label htmlFor="industry">Industry</label>
                <select id="industry" name="industry" required>
                  <option value="">Select an industry</option>
                  <option value="aerospace">Aerospace</option>
                  <option value="defense">Defense</option>
                  <option value="automotive">Automotive</option>
                  <option value="telecommunications">Telecommunications</option>
                  <option value="robotics">Robotics</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="ff">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={4} required></textarea>
              </div>
              <button type="submit" className="btn-submit">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <a href="#" className="foot-logo">
          <img src="/icon_logo.png" alt="Qutlas" />
        </a>
        <div className="foot-copy">&copy; 2024 Qutlas. All rights reserved.</div>
        <div className="foot-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  );
}
