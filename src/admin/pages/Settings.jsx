import { useState } from 'react';

function Toggle({ label, desc, initial = true }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="adm-toggle-row">
      <div className="adm-toggle-info">
        <div className="adm-toggle-label">{label}</div>
        {desc && <div className="adm-toggle-desc">{desc}</div>}
      </div>
      <button
        className={`adm-toggle-pill${on ? ' adm-toggle-pill--on' : ' adm-toggle-pill--off'}`}
        onClick={() => setOn(v => !v)}
        aria-pressed={on}
        aria-label={label}
      />
    </div>
  );
}

export default function Settings() {
  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Settings</h1>
        <p className="adm-page-subtitle">Configure your restaurant and platform preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* General */}
        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">General</span>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title">Restaurant Info</div>
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-label">Restaurant Name</label>
                <input className="adm-input" defaultValue="Burgerizza" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Phone Number</label>
                <input className="adm-input" placeholder="+49 000 000 0000" />
              </div>
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group adm-form-group--full">
                <label className="adm-label">Address</label>
                <input className="adm-input" placeholder="Street, City, Postcode" />
              </div>
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-label">Contact Email</label>
                <input className="adm-input" placeholder="hello@burgerizza.de" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Currency</label>
                <input className="adm-input" defaultValue="EUR (€)" />
              </div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title">Opening Hours</div>
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-label">Weekdays (Mon–Fri)</label>
                <input className="adm-input" defaultValue="11:00 – 22:00" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Weekend (Sat–Sun)</label>
                <input className="adm-input" defaultValue="12:00 – 23:00" />
              </div>
            </div>
          </div>
          <div className="adm-form-save">
            <button className="adm-btn adm-btn--primary">Save Changes</button>
          </div>
        </div>

        {/* Orders */}
        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">Orders</span>
          </div>
          <div className="adm-form-section">
            <Toggle
              label="Accept New Orders"
              desc="Pause this to stop receiving orders temporarily."
              initial={true}
            />
            <Toggle
              label="Order Notifications"
              desc="Play a sound when a new order arrives."
              initial={true}
            />
            <Toggle
              label="Auto-confirm Orders"
              desc="Automatically mark new orders as confirmed."
              initial={false}
            />
            <Toggle
              label="Allow Order Cancellation"
              desc="Let customers cancel within 5 minutes of placing."
              initial={true}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">Notifications</span>
          </div>
          <div className="adm-form-section">
            <Toggle label="Email Notifications"    desc="Receive order summaries by email." initial={true} />
            <Toggle label="New User Alerts"        desc="Get notified when a new account is created." initial={false} />
            <Toggle label="Low Stock Warnings"     desc="Alert when menu items are running low." initial={true} />
            <Toggle label="Daily Report"           desc="Receive a daily sales summary at 23:00." initial={true} />
          </div>
        </div>

        {/* System */}
        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">System</span>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title">Danger Zone</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="adm-btn adm-btn--ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
                Clear All Orders
              </button>
              <button className="adm-btn adm-btn--danger">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Wipe User Data
              </button>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text-3)', marginTop: 10 }}>
              These actions are irreversible. Backend integration required before they are functional.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
