import { useState } from 'react';

const MOCK_USERS = [
  { id: 'u001', name: 'Anna Müller',    email: 'anna@example.com',   joined: '12 Jan 2026', orders: 8,  status: 'active' },
  { id: 'u002', name: 'Lukas Bauer',   email: 'lukas@example.com',  joined: '3 Feb 2026',  orders: 14, status: 'active' },
  { id: 'u003', name: 'Sophie Klein',  email: 'sophie@example.com', joined: '18 Feb 2026', orders: 3,  status: 'active' },
  { id: 'u004', name: 'Max Weber',     email: 'max@example.com',    joined: '5 Mar 2026',  orders: 21, status: 'active' },
  { id: 'u005', name: 'Julia Richter', email: 'julia@example.com',  joined: '22 Mar 2026', orders: 1,  status: 'inactive' },
  { id: 'u006', name: 'Tom Fischer',   email: 'tom@example.com',    joined: '1 Apr 2026',  orders: 7,  status: 'active' },
  { id: 'u007', name: 'Mia Schmidt',   email: 'mia@example.com',    joined: '14 Apr 2026', orders: 5,  status: 'active' },
  { id: 'u008', name: 'Erik Dahl',     email: 'erik@example.com',   joined: '2 May 2026',  orders: 0,  status: 'inactive' },
];

const BADGE = {
  active:   <span className="adm-badge adm-badge--green">Active</span>,
  inactive: <span className="adm-badge adm-badge--gray">Inactive</span>,
};

export default function Users() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Users</h1>
        <p className="adm-page-subtitle">Registered customer accounts.</p>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="adm-select"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="adm-btn adm-btn--ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      </div>

      <div className="adm-card">
        {filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">👤</div>
            <div className="adm-empty-title">No users found</div>
            <div className="adm-empty-sub">Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 900 }}>{u.name}</td>
                    <td className="adm-table-muted">{u.email}</td>
                    <td className="adm-table-muted">{u.joined}</td>
                    <td style={{ fontWeight: 800 }}>{u.orders}</td>
                    <td>{BADGE[u.status]}</td>
                    <td>
                      <button className="adm-btn adm-btn--ghost" style={{ height: 28, padding: '0 10px', fontSize: 11 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
