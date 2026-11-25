import { useState } from 'react';
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

const features = [
    { title: 'Fast checkout', text: 'Scan, add and bill in seconds.' },
    { title: 'Multi-shop control', text: '8 shops, one dashboard.' },
    { title: 'Live stock', text: 'Always know what is on the shelf.' },
];

function BrandIcon({ className = 'h-11 w-11' }) {
    return <img src="/shopflow-mark.svg" alt="" className={`${className} rounded-xl`} />;
}

export default function Login() {
    const { user, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (e) {
            setError(e.errors?.email?.[0] ?? e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

    return (
        <div className="flex min-h-screen">
            {/* Brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-300/10" />

                <div className="relative flex items-center gap-3">
                    <BrandIcon />
                    <span className="text-xl font-semibold tracking-tight">ShopFlow</span>
                </div>

                <div className="relative flex items-center justify-center py-6">
                    <img src="/pos-software.svg" alt="Point of sale dashboard with sales chart, receipt and payment confirmation" className="w-full max-w-xl drop-shadow-2xl" />
                </div>

                <div className="relative space-y-6">
                    <div>
                        <h2 className="text-3xl font-semibold leading-tight">Run every shop from one place.</h2>
                        <p className="mt-2 max-w-md text-emerald-100">Sales, products and stock across all your branches — simple, fast and always in sync.</p>
                    </div>
                    <ul className="grid grid-cols-3 gap-4">
                        {features.map((feature) => (
                            <li key={feature.title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                                <div className="text-sm font-semibold">{feature.title}</div>
                                <div className="mt-1 text-xs text-emerald-100">{feature.text}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <BrandIcon className="h-10 w-10" />
                        <span className="text-lg font-semibold">ShopFlow</span>
                    </div>

                    <Link to="/" className="mb-5 inline-block text-sm font-medium text-emerald-600 transition hover:text-emerald-500">
                        ← Back to home
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="mt-1 text-sm text-slate-500">Sign in to open your register.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {error && (
                            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <label className="block text-sm font-medium">
                            Email
                            <div className="relative mt-1.5">
                                <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="M3 7l9 6 9-6" />
                                </svg>
                                <input type="email" required autoFocus autoComplete="username" placeholder="you@shop.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                            </div>
                        </label>

                        <label className="block text-sm font-medium">
                            Password
                            <div className="relative mt-1.5">
                                <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="11" width="16" height="9" rx="2" />
                                    <path d="M8 11V8a4 4 0 018 0v3" />
                                </svg>
                                <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-11`} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>

                        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60">
                            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiLogIn className="h-4 w-4" />}
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} ShopFlow · All rights reserved</p>
                </div>
            </div>
        </div>
    );
}
