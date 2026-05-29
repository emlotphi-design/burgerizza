import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToOrders, fetchOrders } from './services/adminService';
import './styles/admin.css';

const NAV = [
  {
    section: 'Overview',
    items: [
      {
        to: '/admin',
        end: true,
        label: 'Dashboard',
        icon: (
          <svg className="adm-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        to: '/admin/orders',
        label: 'Orders',
        badgeKey: 'pending',
        icon: (
          <svg className="adm-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        ),
      },
      {
        to: '/admin/products',
        label: 'Products',
        icon: (
          <svg className="adm-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        to: '/admin/users',
        label: 'Users',
        icon: (
          <svg className="adm-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        ),
      },
      {
        to: '/admin/settings',
        label: 'Settings',
        icon: (
          <svg className="adm-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
];

export default function AdminLayout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { currentUser } = useAuth();
  const channelRef = useRef(null);

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : (currentUser?.email?.[0] ?? 'A').toUpperCase();

  const displayName = currentUser?.fullName || currentUser?.email || 'Admin';

  const close = () => setSidebarOpen(false);

  /* Track pending order count for sidebar badge */
  useEffect(() => {
    fetchOrders({ status: 'pending', limit: 99 })
      .then(orders => setPendingCount(orders.length))
      .catch(() => {});

    channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT' && row?.status === 'pending') {
        setPendingCount(c => c + 1);
      } else if (eventType === 'UPDATE') {
        if (old?.status === 'pending' && row?.status !== 'pending')
          setPendingCount(c => Math.max(0, c - 1));
        else if (old?.status !== 'pending' && row?.status === 'pending')
          setPendingCount(c => c + 1);
      } else if (eventType === 'DELETE' && old?.status === 'pending') {
        setPendingCount(c => Math.max(0, c - 1));
      }
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  return (
    <div className="adm-layout">

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar${sidebarOpen ? ' adm-sidebar--open' : ''}`}>

        <div className="adm-brand">
          <div className="adm-brand-logo">
            <div className="adm-brand-icon">🍔</div>
            <div className="adm-brand-name">Burger<span>izza</span></div>
          </div>
          <div className="adm-brand-badge">Admin Panel</div>
        </div>

        <nav className="adm-nav">
          {NAV.map(({ section, items }) => (
            <div key={section} className="adm-nav-section">
              <span className="adm-nav-section-label">{section}</span>
              {items.map(({ to, end, label, icon, badgeKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `adm-nav-link${isActive ? ' adm-nav-link--active' : ''}`
                  }
                  onClick={close}
                >
                  {icon}
                  {label}
                  {badgeKey === 'pending' && pendingCount > 0 && (
                    <span className="adm-nav-badge">{pendingCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-user-row">
            <div className="adm-user-avatar">{initials}</div>
            <div className="adm-user-info">
              <div className="adm-user-name">{displayName}</div>
              <div className="adm-user-email">{currentUser?.email ?? ''}</div>
            </div>
          </div>
          <Link to="/" className="adm-back-link" onClick={close}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to site
          </Link>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      <div
        className={`adm-overlay${sidebarOpen ? ' adm-overlay--visible' : ''}`}
        onClick={close}
      />

      {/* ── Main ── */}
      <div className="adm-main">

        <header className="adm-topbar">
          <button
            className="adm-hamburger"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Toggle navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="adm-topbar-brand">
            Burger<span>izza</span>
            {pendingCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 8, minWidth: 20, height: 20, borderRadius: 10,
                background: '#fbbf24', color: '#1A0A00',
                fontSize: 10, fontWeight: 900, padding: '0 5px',
                verticalAlign: 'middle',
              }}>
                {pendingCount}
              </span>
            )}
          </div>

          <div className="adm-topbar-actions">
            <Link
              to="/"
              title="Back to site"
              style={{
                width: 40, height: 40, display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: 8,
                border: '1px solid var(--adm-border)',
                color: 'var(--adm-text-3)', textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)',
                transition: 'background 0.14s ease, color 0.14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,210,63,0.10)'; e.currentTarget.style.color = 'var(--adm-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--adm-text-3)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </Link>
          </div>
        </header>

        <div className="adm-content">
          <Outlet />
        </div>
      </div>

    </div>
  );
}
