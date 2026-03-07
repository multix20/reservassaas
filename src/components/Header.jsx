import React from 'react';
import { useState, useEffect } from 'react';
import { Menu, X, MapPin, ChevronRight } from 'lucide-react';

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const navLinks = [
    { href: '#inicio',    label: 'Inicio',    desc: 'Bienvenida' },
    { href: '#servicios', label: 'Servicios', desc: 'Lo que ofrecemos' },
    { href: '#ventajas',  label: 'Ventajas',  desc: 'Por qué elegirnos' },
    { href: '#contacto',  label: 'Contacto',  desc: 'Escríbenos' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

        .header-root { font-family: 'DM Sans', sans-serif; }

        .header-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          transition: all 0.4s ease;
        }

        @media (min-width: 768px) {
          .header-bar {
            background: white;
            box-shadow: 0 1px 20px rgba(0,0,0,0.08);
          }
        }

        @media (max-width: 767px) {
          .header-bar.top {
            background: linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%);
            box-shadow: none;
          }
          .header-bar.scrolled {
            background: #1a3d2b;
            box-shadow: 0 2px 20px rgba(0,0,0,0.2);
          }
        }

        .header-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 1.25rem;
          height: 72px; display: flex; align-items: center; justify-content: space-between;
        }

        /* Logo */
        .logo {
          display: flex; align-items: center;
          text-decoration: none; flex-shrink: 0;
        }

        .logo-img {
          height: 56px;
          width: auto;
          object-fit: contain;
          transition: opacity 0.2s;
        }

        /* En móvil invertir colores para que se vea sobre fondo oscuro */
        @media (max-width: 767px) {
          .header-bar.top .logo-img,
          .header-bar.scrolled .logo-img {
            filter: brightness(0) invert(1);
          }
        }

        .logo:hover .logo-img { opacity: 0.85; }

        /* Desktop nav */
        .desktop-nav { display: none; }
        @media (min-width: 768px) {
          .desktop-nav { display: flex; align-items: center; gap: 2rem; }
        }

        .nav-link {
          text-decoration: none; font-size: 17px; font-weight: 500;
          color: #2d6a4f; padding: 6px 0; position: relative; transition: color 0.2s;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 2px; background: #52b788;
          border-radius: 2px; transition: width 0.3s ease;
        }
        .nav-link:hover { color: #1a3d2b; }
        .nav-link:hover::after { width: 100%; }

        .cta-btn {
          background: linear-gradient(135deg, #2d6a4f, #40916c);
          color: white; border: none; padding: 11px 24px;
          border-radius: 8px; font-size: 16px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(45,106,79,0.3);
          text-decoration: none; display: inline-block;
        }
        .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(45,106,79,0.4); }

        /* Hamburger */
        .hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px;
          border: none; cursor: pointer; transition: all 0.2s; background: transparent;
        }
        @media (min-width: 768px) { .hamburger { display: none; } }

        .header-bar.top .hamburger { color: white; }
        .header-bar.top .hamburger:hover { background: rgba(255,255,255,0.15); }
        .header-bar.scrolled .hamburger { color: white; }
        .header-bar.scrolled .hamburger:hover { background: rgba(255,255,255,0.1); }

        /* Drawer overlay */
        .drawer-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
          opacity: 0; pointer-events: none; transition: opacity 0.35s ease;
        }
        .drawer-overlay.open { opacity: 1; pointer-events: all; }

        /* Drawer */
        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw); z-index: 101;
          background: #0d2b1a;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .drawer.open { transform: translateX(0); }

        .drawer::before {
          content: ''; position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(82,183,136,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(45,106,79,0.15) 0%, transparent 50%);
          pointer-events: none;
        }

        .drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(82,183,136,0.15);
          position: relative; z-index: 1;
        }

        .drawer-logo { display: flex; align-items: center; }

        .drawer-logo-img {
          height: 40px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .drawer-close {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid rgba(82,183,136,0.25);
          background: transparent; color: rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .drawer-close:hover { background: rgba(82,183,136,0.15); color: white; }

        .drawer-nav {
          flex: 1; padding: 1.5rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          position: relative; z-index: 1;
        }

        .drawer-nav-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-radius: 12px;
          text-decoration: none; transition: all 0.2s;
          border: 1px solid transparent;
          animation: slideInRight 0.4s ease both;
        }
        .drawer-nav-item:hover {
          background: rgba(82,183,136,0.1);
          border-color: rgba(82,183,136,0.2);
        }

        .drawer-nav-label {
          font-size: 17px; font-weight: 600; color: white;
          font-family: 'Playfair Display', serif;
        }
        .drawer-nav-desc {
          font-size: 11px; color: rgba(255,255,255,0.45);
          margin-top: 2px; font-weight: 400;
        }
        .drawer-nav-arrow { color: rgba(82,183,136,0.6); transition: transform 0.2s; }
        .drawer-nav-item:hover .drawer-nav-arrow { transform: translateX(4px); color: #52b788; }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .drawer-nav-item:nth-child(1) { animation-delay: 0.05s; }
        .drawer-nav-item:nth-child(2) { animation-delay: 0.1s; }
        .drawer-nav-item:nth-child(3) { animation-delay: 0.15s; }
        .drawer-nav-item:nth-child(4) { animation-delay: 0.2s; }

        .drawer-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(82,183,136,0.15);
          position: relative; z-index: 1;
        }

        .drawer-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #2d6a4f, #52b788);
          border: none; border-radius: 12px; color: white;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(45,106,79,0.4);
        }
        .drawer-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,106,79,0.5); }

        .drawer-location {
          display: flex; align-items: center; gap: 6px;
          margin-top: 12px; justify-content: center;
        }
        .drawer-location span {
          font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.5px;
        }
      `}</style>

      <div className="header-root">
        <header className={`header-bar ${isScrolled ? 'scrolled' : 'top'}`}>
          <div className="header-inner">

            {/* Logo */}
            <a href="#inicio" className="logo">
              <img
                src="/Logo_Transporte.jpeg"
                alt="Araucanía Viajes"
                className="logo-img"
              />
            </a>

            {/* Desktop nav */}
            <nav className="desktop-nav">
              {navLinks.map(({ href, label }) => (
                <a key={href} href={href} className="nav-link">{label}</a>
              ))}
              <a href="#contacto" className="cta-btn">Reservar</a>
            </nav>

            {/* Hamburger */}
            <button
              className="hamburger"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* Overlay */}
        <div
          className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => setIsDrawerOpen(false)}
        />

        {/* Drawer */}
        <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <div className="drawer-logo">
              <img
                src="/Logo_Transporte.jpeg"
                alt="Araucanía Viajes"
                className="drawer-logo-img"
              />
            </div>
            <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav className="drawer-nav">
            {navLinks.map(({ href, label, desc }) => (
              <a
                key={href}
                href={href}
                className="drawer-nav-item"
                onClick={() => setIsDrawerOpen(false)}
              >
                <div>
                  <div className="drawer-nav-label">{label}</div>
                  <div className="drawer-nav-desc">{desc}</div>
                </div>
                <ChevronRight size={16} className="drawer-nav-arrow" />
              </a>
            ))}
          </nav>

          <div className="drawer-footer">
            <a href="#contacto" className="drawer-cta" onClick={() => setIsDrawerOpen(false)}>
              <MapPin size={16} />
              Reservar mi viaje
            </a>
            <div className="drawer-location">
              <MapPin size={11} color="rgba(255,255,255,0.4)" />
              <span>Región de La Araucanía, Chile</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;