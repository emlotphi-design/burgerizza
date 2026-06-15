import { useState } from 'react';
import '../styles/products.css';
import '../styles/forms.css';
import Toggle from '../components/ui/Toggle';

function ToggleRow({ label, desc, initial = true }) {
    const [on, setOn] = useState(initial);
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>{label}</div>
                {desc && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{desc}</div>}
            </div>
            <Toggle on={on} onChange={() => setOn(v => !v)} label={label} />
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="admin-products-panel">
            <div className="admin-products-panel-head">
                <span className="admin-products-panel-title">{title}</span>
            </div>
            {children}
        </div>
    );
}

export default function Settings() {
    return (
        <div className="admin-products-page">
            <div className="admin-page-header">
                <div>
                    <h2>Settings</h2>
                    <p className="admin-page-subtitle">Configure your restaurant and platform preferences.</p>
                </div>
            </div>

            <Section title="Restaurant Info">
                <div className="admin-form-2col" style={{ marginBottom: 14 }}>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Restaurant Name</label>
                        <input className="admin-form-input" defaultValue="BURGERIZZA" />
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Phone Number</label>
                        <input className="admin-form-input" placeholder="+49 000 000 0000" />
                    </div>
                </div>
                <div className="admin-form-row" style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Address</label>
                    <input className="admin-form-input" placeholder="Street, City, Postcode" />
                </div>
                <div className="admin-form-2col" style={{ marginBottom: 18 }}>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Contact Email</label>
                        <input className="admin-form-input" placeholder="hello@burgerizza.de" />
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Currency</label>
                        <input className="admin-form-input" defaultValue="EUR (€)" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="admin-btn admin-btn--primary">Save Changes</button>
                </div>
            </Section>

            <Section title="Opening Hours">
                <div className="admin-form-2col">
                    <div className="admin-form-row">
                        <label className="admin-form-label">Weekdays (Mon–Fri)</label>
                        <input className="admin-form-input" defaultValue="11:00 – 22:00" />
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Weekend (Sat–Sun)</label>
                        <input className="admin-form-input" defaultValue="12:00 – 23:00" />
                    </div>
                </div>
            </Section>

            <Section title="Orders">
                <ToggleRow label="Accept New Orders"        desc="Pause this to stop receiving orders temporarily." initial={true} />
                <ToggleRow label="Order Notifications"      desc="Play a sound when a new order arrives." initial={true} />
                <ToggleRow label="Auto-confirm Orders"      desc="Automatically mark new orders as confirmed." initial={false} />
                <ToggleRow label="Allow Order Cancellation" desc="Let customers cancel within 5 minutes of placing." initial={true} />
            </Section>

            <Section title="Notifications">
                <ToggleRow label="Email Notifications" desc="Receive order summaries by email." initial={true} />
                <ToggleRow label="New User Alerts"     desc="Get notified when a new account is created." initial={false} />
                <ToggleRow label="Low Stock Warnings"  desc="Alert when menu items are running low." initial={true} />
                <ToggleRow label="Daily Report"        desc="Receive a daily sales summary at 23:00." initial={true} />
            </Section>

            <Section title="Danger Zone">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <button className="admin-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                        </svg>
                        Clear All Orders
                    </button>
                    <button
                        className="admin-product-btn admin-product-btn--danger"
                        style={{ height: 'auto', padding: '10px 18px', borderRadius: 14, fontSize: '0.88rem' }}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                        Wipe User Data
                    </button>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
                    These actions are irreversible. Backend integration required before they become functional.
                </p>
            </Section>
        </div>
    );
}
