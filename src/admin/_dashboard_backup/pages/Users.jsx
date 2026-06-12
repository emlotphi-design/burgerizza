import { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole } from '../services/adminService';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updating, setUpdating]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try { setUsers(await fetchUsers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleRoleToggle(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setUpdating(user.id);
    try {
      const updated = await updateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    } catch (e) {
      alert('Failed to update role: ' + e.message);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
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
          placeholder="Search by email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="adm-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="adm-btn adm-btn--ghost" onClick={load}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>
          Failed to load users: {error}
        </div>
      )}

      <div className="adm-card">
        {loading ? (
          <div className="adm-empty"><div className="adm-empty-sub">Loading users…</div></div>
        ) : filtered.length === 0 ? (
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
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 800 }}>{u.email}</td>
                    <td>
                      {u.role === 'admin'
                        ? <span className="adm-badge adm-badge--amber">Admin</span>
                        : <span className="adm-badge adm-badge--gray">User</span>
                      }
                    </td>
                    <td className="adm-table-muted">{fmtDate(u.created_at)}</td>
                    <td>
                      <button
                        className="adm-btn adm-btn--ghost"
                        style={{ height: 36, padding: '0 12px', fontSize: 12 }}
                        onClick={() => handleRoleToggle(u)}
                        disabled={updating === u.id}
                      >
                        {updating === u.id
                          ? '…'
                          : u.role === 'admin' ? 'Remove Admin' : 'Make Admin'
                        }
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
