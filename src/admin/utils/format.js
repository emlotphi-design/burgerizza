export function fmtCurrency(n) {
    return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(isoDate) {
    return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
}

export function itemsSummary(items) {
    if (!Array.isArray(items) || !items.length) return '—';
    return items
        .map(i => { const label = i.name || i.type || 'Item'; const qty = i.quantity ?? 1; return qty > 1 ? `${label} ×${qty}` : label; })
        .slice(0, 2)
        .join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '');
}
