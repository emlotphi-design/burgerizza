/**
 * Hand-drawn inline SVG icons for the Inventory category tiles — same
 * stroke-based 24x24 style already used for the admin sidebar nav icons
 * (AdminLayout.jsx). No image files; these are the only "icons" this
 * feature introduces, per the "do not generate images" requirement.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2.2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function RefrigeratorIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="6" y1="9.5" x2="18" y2="9.5" />
      <line x1="9" y1="4.5" x2="9" y2="6.5" />
      <line x1="9" y1="12" x2="9" y2="14" />
    </svg>
  );
}

export function DoughIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M12 7c-1.6-1.6-4-1.6-5 0 1.6 1.6 3.4 1.6 5 0zM12 7c1.6-1.6 4-1.6 5 0-1.6 1.6-3.4 1.6-5 0z" />
      <path d="M12 12c-1.6-1.6-4-1.6-5 0 1.6 1.6 3.4 1.6 5 0zM12 12c1.6-1.6 4-1.6 5 0-1.6 1.6-3.4 1.6-5 0z" />
      <path d="M12 17c-1.6-1.6-4-1.6-5 0 1.6 1.6 3.4 1.6 5 0zM12 17c1.6-1.6 4-1.6 5 0-1.6 1.6-3.4 1.6-5 0z" />
    </svg>
  );
}

export function PackagingIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8L12 3 3 8l9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </svg>
  );
}

export function DrinksIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 2h6" />
      <path d="M10 2v4.5L7 10v10a2 2 0 002 2h6a2 2 0 002-2V10l-3-3.5V2" />
      <line x1="7.6" y1="14" x2="16.4" y2="14" />
    </svg>
  );
}

export function FolderIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
    </svg>
  );
}

/** Category name → icon component. Any category the admin adds beyond the
 * original four falls back to FolderIcon. */
export const CATEGORY_ICON_MAP = {
  'Refrigerated':      RefrigeratorIcon,
  'Bread & Dough':     DoughIcon,
  'Boxes & Packaging': PackagingIcon,
  'Drinks':            DrinksIcon,
};

export function getCategoryIcon(name) {
  return CATEGORY_ICON_MAP[name] ?? FolderIcon;
}

/** Category name → accent color, used for the home tiles' gradients and
 * the detail view's accent. Falls back to the same gold accent the rest
 * of the admin dashboard uses. */
export const CATEGORY_COLOR_MAP = {
  'Refrigerated':      { key: 'blue',   rgb: '59,130,246' },
  'Bread & Dough':     { key: 'orange', rgb: '249,115,22' },
  'Boxes & Packaging': { key: 'purple', rgb: '168,85,247' },
  'Drinks':            { key: 'green',  rgb: '34,197,94' },
};

export function getCategoryColor(name) {
  return CATEGORY_COLOR_MAP[name] ?? { key: 'gold', rgb: '250,204,21' };
}
