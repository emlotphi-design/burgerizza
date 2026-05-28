const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('bz_jwt');
}

export function setToken(token) {
  if (token) localStorage.setItem('bz_jwt', token);
  else localStorage.removeItem('bz_jwt');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export const api = {
  auth: {
    register: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login:    (body) => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    me:       ()     => apiFetch('/api/auth/me'),
  },
  burgers: {
    save:   (body) => apiFetch('/api/burgers',      { method: 'POST',   body: JSON.stringify(body) }),
    list:   ()     => apiFetch('/api/burgers'),
    remove: (id)   => apiFetch(`/api/burgers/${id}`, { method: 'DELETE' }),
  },
  pizzas: {
    save:   (body) => apiFetch('/api/pizzas',       { method: 'POST',   body: JSON.stringify(body) }),
    list:   ()     => apiFetch('/api/pizzas'),
    remove: (id)   => apiFetch(`/api/pizzas/${id}`,  { method: 'DELETE' }),
  },
  orders: {
    create: (body) => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
    list:   ()     => apiFetch('/api/orders'),
    get:    (id)   => apiFetch(`/api/orders/${id}`),
  },
};
