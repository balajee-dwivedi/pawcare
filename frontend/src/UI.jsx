import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export function PawMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 5c-8 0-14.5 6.3-14.5 14.1 0 5.9 3.5 10.9 8.6 13.1 1.5.7 2.7 2.2 2.7 4 0 2.2 1.4 3.8 3.2 3.8s3.2-1.6 3.2-3.8c0-1.8 1.2-3.3 2.7-4 5.1-2.2 8.6-7.2 8.6-13.1C38.5 11.3 32 5 24 5Z"
      />
      <circle cx="9" cy="8" r="4" fill="currentColor" />
      <circle cx="19" cy="4.7" r="4" fill="currentColor" />
      <circle cx="29" cy="4.7" r="4" fill="currentColor" />
      <circle cx="39" cy="8" r="4" fill="currentColor" />
    </svg>
  );
}

const links = [
  ['Find help', '/assistance'],
  ['Adopt', '/adopt'],
  ['Shelters', '/shelters'],
  ['Lost & found', '/lost-found'],
];

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dashboard = user
    ? { user: '/dashboard', volunteer: '/volunteer', shelter: '/shelter', admin: '/admin' }[
        user.role
      ]
    : '';
  return (
    <>
      <div className="topline">
        <div className="container">
          <span>NEIGHBORS FOR ANIMALS IN NEED</span>
          <span>
            Kindness travels farther together <b>·</b> <Link to="/contact">Get help</Link>
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container nav-shell">
          <Link to="/" className="brand" aria-label="PawCare home">
            <PawMark />
            <span className="brand-name">
              Paw<span>Care</span>
            </span>
          </Link>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? '×' : '☰'}
          </button>
          <nav className={`primary-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
            {links.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
                <Link className="button button-outline button-small" to={dashboard}>
                  Dashboard
                </Link>
                <button className="button-text" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="button button-outline button-small" to="/login">
                  Sign in
                </Link>
                <Link className="button button-primary button-small" to="/report">
                  Report an animal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <PawMark />
              <span className="brand-name">
                Paw<span>Care</span>
              </span>
            </Link>
            <p>
              A thoughtful neighborhood network for animal rescue, safer reunions and second
              chances.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <strong>Find care</strong>
              <Link to="/assistance">Assistance map</Link>
              <Link to="/rescue">Request rescue</Link>
              <Link to="/shelters">Shelters</Link>
            </div>
            <div>
              <strong>Find a friend</strong>
              <Link to="/adopt">Adoption listings</Link>
              <Link to="/lost-found">Lost & found</Link>
              <Link to="/contact">Contact & help</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PawCare community</span>
          <span>Map tiles © OpenStreetMap contributors</span>
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow = 'PAWCARE COMMUNITY', title, description, action }) {
  return (
    <section className="page-intro">
      <div className="container page-intro-row">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

export function Alert({ children, kind = 'info' }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
export function PriorityBadge({ value = 'Normal' }) {
  return <span className={`priority priority-${value.toLowerCase()}`}>{value}</span>;
}
export function StatusBadge({ value = 'Pending' }) {
  return (
    <span className={`status status-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
  );
}
export function Loading({ label = 'Loading PawCare…' }) {
  return (
    <div className="page-loading" role="status">
      {label}
    </div>
  );
}
export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function PhotoPlaceholder({ src, animal = '🐾' }) {
  return (
    <div className="animal-photo">
      {src ? (
        <img src={src} alt="Animal available for adoption" loading="lazy" />
      ) : (
        <span className="animal-photo-placeholder" aria-label="Animal photo not provided">
          {animal}
        </span>
      )}
    </div>
  );
}

export function PageSection({ title, detail, children, action }) {
  return (
    <section className="surface">
      <div className="dashboard-section-head">
        <div>
          <h2>{title}</h2>
          {detail && <p>{detail}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
