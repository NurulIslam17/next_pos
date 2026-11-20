import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Barcodes from './pages/Barcodes';
import Brands from './pages/config/Brands';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import PaymentTypes from './pages/config/PaymentTypes';
import Permissions from './pages/config/Permissions';
import Roles from './pages/config/Roles';
import Shops from './pages/config/Shops';
import Suppliers from './pages/config/Suppliers';
import Users from './pages/config/Users';
import Login from './pages/Login';
import Products from './pages/Products';
import Purchases from './pages/Purchases';

// Each page with the permission needed to open it; the first match becomes the landing page.
const pages = [
    { path: '/dashboard', permission: 'dashboard.view', element: <Dashboard /> },
    { path: '/products', permission: 'products.view', element: <Products /> },
    { path: '/purchases', permission: 'purchases.view', element: <Purchases /> },
    { path: '/categories', permission: 'categories.view', element: <Categories /> },
    { path: '/brands', permission: 'brands.view', element: <Brands /> },
    { path: '/barcodes', permission: 'barcodes.view', element: <Barcodes /> },
    { path: '/configuration/users', permission: 'users.view', element: <Users /> },
    { path: '/configuration/shops', permission: 'shops.view', element: <Shops /> },
    { path: '/configuration/suppliers', permission: 'suppliers.view', element: <Suppliers /> },
    { path: '/configuration/payment-types', permission: 'payment_types.view', element: <PaymentTypes /> },
    { path: '/configuration/roles', permission: 'roles.view', element: <Roles /> },
    { path: '/configuration/permissions', permission: 'permissions.view', element: <Permissions /> },
];

function RequireAuth({ children }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
    }

    return user ? children : <Navigate to="/login" replace />;
}

function RequirePermission({ permission, children }) {
    const { can } = useAuth();

    return can(permission) ? (
        children
    ) : (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
            <h1 className="text-lg font-semibold">Access denied</h1>
            <p className="mt-1 text-sm text-slate-500">You do not have permission to view this page.</p>
        </div>
    );
}

function Landing() {
    const { can } = useAuth();
    const first = pages.find((page) => can(page.permission));

    return first ? (
        <Navigate to={first.path} replace />
    ) : (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
            <h1 className="text-lg font-semibold">No access yet</h1>
            <p className="mt-1 text-sm text-slate-500">Your account has no permissions. Ask an administrator to assign you a role.</p>
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                element={
                    <RequireAuth>
                        <Layout />
                    </RequireAuth>
                }
            >
                {pages.map((page) => (
                    <Route key={page.path} path={page.path} element={<RequirePermission permission={page.permission}>{page.element}</RequirePermission>} />
                ))}
                <Route path="/configuration" element={<Navigate to="/configuration/users" replace />} />
                <Route path="*" element={<Landing />} />
            </Route>
        </Routes>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);
