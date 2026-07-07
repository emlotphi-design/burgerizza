/**
 * Time-filter presets for Analytics — each returns a half-open [from, to)
 * Date pair in local time, matching what the analytics_* RPCs expect
 * (migration 024). Monday-start weeks, matching the app's German locale.
 */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  return addDays(x, -day);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function startOfYear(d) {
  return new Date(d.getFullYear(), 0, 1);
}

export const TIME_FILTERS = [
  { value: 'today',       label: 'Today' },
  { value: 'yesterday',   label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'this_week',   label: 'This Week' },
  { value: 'last_week',   label: 'Last Week' },
  { value: 'this_month',  label: 'This Month' },
  { value: 'last_month',  label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_year',   label: 'This Year' },
  { value: 'previous_year', label: 'Previous Year' },
  { value: 'custom',      label: 'Custom Range' },
];

// Every function returns { from: Date, to: Date } — `to` is exclusive.
export function resolveDateRange(filter, custom) {
  const now = new Date();

  switch (filter) {
    case 'today': {
      const from = startOfDay(now);
      return { from, to: addDays(from, 1) };
    }
    case 'yesterday': {
      const from = addDays(startOfDay(now), -1);
      return { from, to: addDays(from, 1) };
    }
    case 'last_7_days': {
      const to = addDays(startOfDay(now), 1);
      return { from: addDays(to, -7), to };
    }
    case 'this_week': {
      const from = startOfWeek(now);
      return { from, to: addDays(from, 7) };
    }
    case 'last_week': {
      const from = addDays(startOfWeek(now), -7);
      return { from, to: addDays(from, 7) };
    }
    case 'this_month': {
      const from = startOfMonth(now);
      return { from, to: addMonths(from, 1) };
    }
    case 'last_month': {
      const from = addMonths(startOfMonth(now), -1);
      return { from, to: startOfMonth(now) };
    }
    case 'last_3_months': {
      const to = addMonths(startOfMonth(now), 1);
      return { from: addMonths(startOfMonth(now), -2), to };
    }
    case 'last_6_months': {
      const to = addMonths(startOfMonth(now), 1);
      return { from: addMonths(startOfMonth(now), -5), to };
    }
    case 'this_year': {
      const from = startOfYear(now);
      return { from, to: new Date(from.getFullYear() + 1, 0, 1) };
    }
    case 'previous_year': {
      const from = new Date(startOfYear(now).getFullYear() - 1, 0, 1);
      return { from, to: startOfYear(now) };
    }
    case 'custom': {
      if (!custom?.from || !custom?.to) return { from: startOfDay(now), to: addDays(startOfDay(now), 1) };
      return { from: startOfDay(custom.from), to: addDays(startOfDay(custom.to), 1) };
    }
    default:
      return { from: startOfDay(now), to: addDays(startOfDay(now), 1) };
  }
}

// Picks a sensible sales-timeseries bucket size for a given range, so
// "Today" shows hourly bars and "This Year" shows monthly bars automatically.
export function granularityFor(filter) {
  if (filter === 'today' || filter === 'yesterday') return 'hour';
  if (['this_week', 'last_week', 'last_7_days'].includes(filter)) return 'day';
  if (['this_month', 'last_month'].includes(filter)) return 'day';
  if (['last_3_months', 'last_6_months'].includes(filter)) return 'week';
  return 'month';
}
