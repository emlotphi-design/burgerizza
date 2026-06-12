# Admin Dashboard UI Backup
Snapshot taken: 2026-06-12

This folder is a READ-ONLY reference archive. Nothing in here is imported or rendered by the live app.
Use it as a copy-paste source when rebuilding the new dashboard.

## What's inside

### Layout / Shell
| File | What it contains |
|------|-----------------|
| `AdminLayout.jsx` | Sidebar + Topbar shell, NAV config, LockedNavLink, StaffLockProvider, theme toggle, realtime pending-count subscription |
| `AdminRoute.jsx` | Auth guard that wraps the admin section |

### Pages
| File | Key logic to reuse |
|------|-------------------|
| `pages/Orders.jsx` | STATUS_FLOW, STATUS_MAP, PIPELINE, all helpers (fmtCurrency, timeAgo, fmtEstDelivery…), SmartPipeline, InlineOrderItems, RowActions, OrderInfoPanel, Toast, handleAction, handleDriverAndAdvance, realtime subscription |
| `pages/Dashboard.jsx` | Analytics / overview page |
| `pages/Drivers.jsx` | Driver list and management |
| `pages/DriverDetail.jsx` | Single driver detail view |
| `pages/Ingredients.jsx` | Ingredient stock management |
| `pages/POS.jsx` | Point-of-sale mode |
| `pages/Products.jsx` | Product catalog management |
| `pages/Settings.jsx` | Restaurant settings |
| `pages/Users.jsx` | Customer list |

### Styles
| File | What's in it |
|------|-------------|
| `styles/admin.css` | Full design system: CSS tokens, sidebar, topbar, nav, cards, badges, pipeline, toolbar, tables, forms, ord-* order cards, dark mode, responsive breakpoints |
| `styles/dashboard.css` | Dashboard / analytics page styles |
| `styles/ingredients.css` | Ingredients page styles |
| `styles/pos.css` | POS mode styles |

### Logic (safe to import directly into new dashboard)
| File | What it does |
|------|-------------|
| `services/adminService.js` | All Supabase API calls: fetchOrders, updateOrderStatus, assignDriverAndAdvance, subscribeToOrders, fetchDrivers, createDriverAssignment, updateRestaurantStatus, fetchRestaurantStatus |
| `hooks/useAdminCheck.js` | Auth hook — checks admin role |
| `context/StaffLockContext.jsx` | StaffLockProvider + useStaffLock — controls which nav items are locked |
| `config/staffLock.js` | Lock configuration |
| `components/AdminForbidden.jsx` | 403 fallback component |
| `utils/ingredientImages.js` | Ingredient image map utility |

## How to reuse pieces

When building the new dashboard, cherry-pick from this archive:

- **Copy a handler verbatim** — `handleAction`, `handleDriverAndAdvance`, `subscribeToOrders` etc. are self-contained and have no UI dependencies.
- **Copy a sub-component** — `SmartPipeline`, `InlineOrderItems`, `OrderInfoPanel`, `Toast` can all be lifted out as-is and placed into new card layouts.
- **Copy CSS tokens** — The `:root` variable block in `styles/admin.css` (lines 76–160) defines the full color/shadow/radius system. Port the tokens you want to keep.
- **Do NOT import these files directly** — They reference each other with old relative paths. Always copy-paste the relevant section into the new file.
