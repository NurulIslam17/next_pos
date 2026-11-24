import { useEffect, useRef, useState } from 'react';
import { BsUpcScan } from 'react-icons/bs';
import { FiActivity, FiChevronDown, FiChevronRight, FiCreditCard, FiGlobe, FiGrid, FiKey, FiList, FiLogOut, FiPackage, FiPieChart, FiRotateCcw, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiTag, FiTruck, FiUser, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import ChangePasswordForm from './ChangePasswordForm';
import Modal from './Modal';
import ProfileForm from './ProfileForm';
import UserPhoto from './UserPhoto';

const roleLabel = (role) =>
    ({ super_admin: 'Super Admin', manager: 'Shop Manager', viewer: 'Viewer' })[role] ??
    (role ?? 'No role').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// A group has `children`; a leaf has `to`. `permission` hides items the user cannot view.
const navigation = [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid, permission: 'dashboard.view' },
    { to: '/shop-monitor', label: 'Shop Monitor', icon: FiActivity, permission: 'shop_monitor.view' },
    { to: '/products', label: 'Products', icon: FiPackage, permission: 'products.view' },
    { to: '/purchases', label: 'Purchasing', icon: FiShoppingCart, permission: 'purchases.view' },
    { to: '/sales', label: 'Sales', icon: FiTrendingUp, permission: 'sales.view' },
    { to: '/categories', label: 'Categories', icon: FiTag, permission: 'categories.view' },
    { to: '/brands', label: 'Brands', icon: FiAward, permission: 'brands.view' },
    { to: '/barcodes', label: 'Barcode', icon: BsUpcScan, permission: 'barcodes.view' },
    {
        label: 'Reports',
        icon: FiPieChart,
        children: [
            { to: '/reports/stocks', label: 'Stocks Report', icon: FiPackage, permission: 'reports.view' },
            { to: '/reports/purchases', label: 'Purchase Report', icon: FiShoppingCart, permission: 'reports.view' },
            { to: '/reports/sales', label: 'Sales Report', icon: FiTrendingUp, permission: 'reports.view' },
            { to: '/reports/returns', label: 'Sales Return', icon: FiRotateCcw, permission: 'reports.view' },
            { to: '/reports/registrar', label: 'Registrar Report', icon: FiList, permission: 'reports.view' },
        ],
    },
    {
        label: 'Configuration',
        icon: FiSettings,
        children: [
            { to: '/configuration/landing-page', label: 'Landing Page', icon: FiGlobe, permission: 'landing_page.view' },
            { to: '/configuration/users', label: 'Users', icon: FiUsers, permission: 'users.view' },
            { to: '/configuration/shops', label: 'Shops', icon: FiShoppingBag, permission: 'shops.view' },
            { to: '/configuration/suppliers', label: 'Suppliers', icon: FiTruck, permission: 'suppliers.view' },
            { to: '/configuration/customers', label: 'Customers', icon: FiUser, permission: 'customers.view' },
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
    const { user, logout, can, updateUser } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        if (!isUserMenuOpen) return;

        const closeOnOutsideClick = (event) => {
            if (!userMenuRef.current?.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, [isUserMenuOpen]);

    return (
        <div className="app-shell flex h-screen overflow-hidden">
            <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto bg-slate-900 text-slate-200 md:flex">
                <div className="flex items-center gap-3 px-6 py-5">
                    <img src="/shopflow-mark.svg" alt="" className="h-9 w-9 rounded-xl" />
                    <span className="text-lg font-semibold tracking-tight text-white">ShopFlow</span>
                </div>
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
                    <div className="flex items-center gap-2 md:hidden">
                        <img src="/shopflow-mark.svg" alt="" className="h-8 w-8 rounded-lg" />
                        <span className="font-semibold">ShopFlow</span>
                    </div>
                    <div className="relative ml-auto" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            aria-haspopup="menu"
                            aria-expanded={isUserMenuOpen}
                            aria-label="Account menu"
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-right text-sm leading-tight transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                        >
                            <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-slate-500">
                                    {roleLabel(user.role)}
                                    {user.shop ? ` · ${user.shop}` : ''}
                                </div>
                            </div>
                            <UserPhoto user={user} className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
                            <FiChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUserMenuOpen && (
                            <div role="menu" className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                                <button
                                    role="menuitem"
                                    onClick={() => { setIsUserMenuOpen(false); setIsProfileOpen(true); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 transition hover:bg-slate-50"
                                >
                                    <FiUser className="h-4 w-4 text-slate-400" /> Update Profile
                                </button>
                                <button
                                    role="menuitem"
                                    onClick={() => { setIsUserMenuOpen(false); setIsPasswordOpen(true); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 transition hover:bg-slate-50"
                                >
                                    <FiKey className="h-4 w-4 text-slate-400" /> Change Password
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    role="menuitem"
                                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
                                >
                                    <FiLogOut className="h-4 w-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>
                <main className="app-main flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
            {isProfileOpen && (
                <Modal title="Update profile" onClose={() => setIsProfileOpen(false)}>
                    <ProfileForm
                        user={user}
                        onSaved={(nextUser) => {
                            updateUser(nextUser);
                            setIsProfileOpen(false);
                        }}
                        onCancel={() => setIsProfileOpen(false)}
                    />
                </Modal>
            )}
            {isPasswordOpen && (
                <Modal title="Change password" onClose={() => setIsPasswordOpen(false)}>
                    <ChangePasswordForm
                        onSaved={() => setIsPasswordOpen(false)}
                        onCancel={() => setIsPasswordOpen(false)}
                    />
                </Modal>
            )}
        </div>
    );
}
