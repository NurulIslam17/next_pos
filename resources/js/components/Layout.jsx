import { useState } from 'react';
import { BsUpcScan } from 'react-icons/bs';
import { FiActivity, FiChevronRight, FiCreditCard, FiGrid, FiKey, FiLogOut, FiPackage, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiTag, FiTruck, FiUsers, FiAward } from 'react-icons/fi';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

const roleLabel = (role) =>
    ({ super_admin: 'Super Admin', manager: 'Shop Manager', viewer: 'Viewer' })[role] ??
    (role ?? 'No role').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// A group has `children`; a leaf has `to`. `permission` hides items the user cannot view.
const navigation = [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid, permission: 'dashboard.view' },
    { to: '/shop-monitor', label: 'Shop Monitor', icon: FiActivity, permission: 'shop_monitor.view' },
    { to: '/products', label: 'Products', icon: FiPackage, permission: 'products.view' },
    { to: '/purchases', label: 'Purchasing', icon: FiShoppingCart, permission: 'purchases.view' },
    { to: '/categories', label: 'Categories', icon: FiTag, permission: 'categories.view' },
    { to: '/brands', label: 'Brands', icon: FiAward, permission: 'brands.view' },
    { to: '/barcodes', label: 'Barcode', icon: BsUpcScan, permission: 'barcodes.view' },
    {
        label: 'Configuration',
        icon: FiSettings,
        children: [
            { to: '/configuration/users', label: 'Users', icon: FiUsers, permission: 'users.view' },
            { to: '/configuration/shops', label: 'Shops', icon: FiShoppingBag, permission: 'shops.view' },
            { to: '/configuration/suppliers', label: 'Suppliers', icon: FiTruck, permission: 'suppliers.view' },
            { to: '/configuration/payment-types', label: 'Payment Types', icon: FiCreditCard, permission: 'payment_types.view' },
            { to: '/configuration/roles', label: 'Roles', icon: FiShield, permission: 'roles.view' },
            { to: '/configuration/permissions', label: 'Permissions', icon: FiKey, permission: 'permissions.view' },
        ],
    },
];

const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`;

function NavGroup({ group, items }) {
    const { pathname } = useLocation();
    const isInside = items.some((item) => pathname.startsWith(item.to));
    const [open, setOpen] = useState(isInside);
    const expanded = open || isInside;

    return (
        <div>
            <button
                onClick={() => setOpen(!expanded)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 ${isInside ? 'text-white' : ''}`}
            >
                <span className="flex items-center gap-3">
                    <group.icon className="h-4 w-4 shrink-0" />
                    {group.label}
                </span>
                <FiChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            {expanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                    {items.map((item) => (
                        <NavLink key={item.to} to={item.to} className={linkClass}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { user, logout, can } = useAuth();

    return (
        <div className="app-shell flex h-screen overflow-hidden">
            <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto bg-slate-900 text-slate-200 md:flex">
                <div className="px-6 py-5 text-lg font-semibold tracking-tight text-white">My POS</div>
                <nav className="flex-1 space-y-1 px-3">
                    {navigation
                        .filter((entry) => !entry.children && can(entry.permission))
                        .map((entry) => (
                            <NavLink key={entry.to} to={entry.to} className={linkClass}>
                                <entry.icon className="h-4 w-4 shrink-0" />
                                {entry.label}
                            </NavLink>
                        ))}
                </nav>

                {/* Groups such as Configuration are pinned to the bottom of the sidebar. */}
                <div className="space-y-1 border-t border-slate-800 px-3 py-3">
                    {navigation
                        .filter((entry) => entry.children)
                        .map((entry) => {
                            const visible = entry.children.filter((child) => can(child.permission));
                            return visible.length ? <NavGroup key={entry.label} group={entry} items={visible} /> : null;
                        })}
                </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                    <span className="font-semibold md:hidden">My POS</span>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right text-sm leading-tight">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-500">
                                {roleLabel(user.role)}
                                {user.shop ? ` · ${user.shop}` : ''}
                            </div>
                        </div>
                        <button onClick={logout} aria-label="Log out" title="Log out" className="p-1 text-red-600 transition hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">
                            <FiLogOut className="h-7 w-7" />
                        </button>
                    </div>
                </header>
                <main className="app-main flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
