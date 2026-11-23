import { useState } from 'react';
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

const features = [
    { title: 'Fast checkout', text: 'Scan, add and bill in seconds.' },
    { title: 'Multi-shop control', text: '8 shops, one dashboard.' },
    { title: 'Live stock', text: 'Always know what is on the shelf.' },
];

function Receipt() {
    const lines = [
        ['Nokshi Tray (Bamboo)', '1', '420.00'],
        ['Cup Pirich', '6', '576.00'],
        ['Panir Glass', '2', '120.00'],
    ];

    return (
        <div className="w-72 rotate-3 rounded-lg bg-white p-5 font-mono text-xs text-slate-700 shadow-2xl">
            <div className="text-center">
                <div className="text-sm font-bold tracking-widest">MY POS</div>
                <div className="text-[10px] text-slate-400">INVOICE #000-221011-1264</div>
            </div>
            <div className="my-3 border-t border-dashed border-slate-300" />
            {lines.map(([name, qty, amount]) => (
                <div key={name} className="flex justify-between gap-2 py-0.5">
                    <span className="truncate">
                        {qty}× {name}
                    </span>
                    <span>{amount}</span>
                </div>
            ))}
            <div className="my-3 border-t border-dashed border-slate-300" />
            <div className="flex justify-between text-sm font-bold">
                <span>TOTAL</span>
                <span>1,116.00</span>
            </div>
            <div className="mt-4 flex h-8 items-end justify-center gap-[2px]">
                {Array.from({ length: 36 }).map((_, i) => (
                    <span key={i} className="bg-slate-800" style={{ width: i % 3 === 0 ? 3 : 1.5, height: `${60 + ((i * 37) % 40)}%` }} />
                ))}
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">THANK YOU · PLEASE COME AGAIN</div>
        </div>
    );
}

function BrandIcon({ className = 'h-6 w-6' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M4 9v11h16V9" />
            <path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" />
            <path d="M10 20v-5h4v5" />
        </svg>
    );
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
        'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

    return (
        <div className="flex min-h-screen">
            {/* Brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-400/10" />

                <div className="relative flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                        <BrandIcon />
                    </span>
                    <span className="text-xl font-semibold tracking-tight">My POS</span>
                </div>

                <div className="relative flex items-center justify-center py-8">
                    <Receipt />
                </div>

                <div className="relative space-y-6">
                    <div>
                        <h2 className="text-3xl font-semibold leading-tight">Run every shop from one place.</h2>
                        <p className="mt-2 max-w-md text-indigo-200">Sales, products and stock across all your branches — simple, fast and always in sync.</p>
                    </div>
                    <ul className="grid grid-cols-3 gap-4">
                        {features.map((feature) => (
                            <li key={feature.title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                                <div className="text-sm font-semibold">{feature.title}</div>
                                <div className="mt-1 text-xs text-indigo-200">{feature.text}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <BrandIcon className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-semibold">My POS</span>
                    </div>

                    <Link to="/" className="mb-5 inline-block text-sm font-medium text-indigo-600 transition hover:text-indigo-500">
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

                        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60">
                            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiLogIn className="h-4 w-4" />}
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} My POS · All rights reserved</p>
                </div>
            </div>
        </div>
    );
}
