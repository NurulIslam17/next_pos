import { useEffect, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiHome, FiLayers, FiMail, FiMapPin, FiPackage, FiPhone, FiShoppingCart, FiTrendingUp, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

const fallbackContent = {
    brand_name: 'ShopFlow',
    eyebrow: 'One workspace for every branch',
    hero_title: 'Run every shop from one place.',
    hero_description: 'Track sales, purchases, products and stock across all your branches from one fast, simple workspace.',
    primary_cta_label: 'Sign in to POS',
    primary_cta_url: '/login',
    secondary_cta_label: 'Explore features',
    features: [
        { title: 'Fast checkout', description: 'Build baskets and print invoices in seconds.' },
        { title: 'Live inventory', description: 'See accurate stock levels for every shop.' },
        { title: 'Smart purchasing', description: 'Manage suppliers, costs and approvals in one flow.' },
        { title: 'Clear reporting', description: 'Understand sales, stock and branch performance.' },
        { title: 'Role based access', description: 'Give every teammate the right level of access.' },
        { title: 'Always available', description: 'Open the register from any browser on your network.' },
    ],
    showcase_title: 'Built for busy counters',
    showcase_description: 'A clean, focused interface keeps your team moving from the first scan to the final receipt.',
    contact_email: null,
    contact_phone: null,
    contact_address: null,
    footer_text: 'All rights reserved.',
};

const featureIcons = [FiZap, FiPackage, FiShoppingCart, FiTrendingUp, FiCheckCircle, FiLayers];

function BrandMark({ name, inverse = false }) {
    return (
        <div className="flex items-center gap-3">
            <img src="/shopflow-mark.svg" alt="" className="h-10 w-10 rounded-xl" />
            <span className={`text-lg font-semibold tracking-tight ${inverse ? 'text-white' : 'text-slate-900'}`}>{name}</span>
        </div>
    );
}

function FeatureCard({ feature, index }) {
    const Icon = featureIcons[index % featureIcons.length];

    return (
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
        </article>
    );
}

export default function Home() {
    const { user } = useAuth();
    const [content, setContent] = useState(fallbackContent);
    const [isUnavailable, setIsUnavailable] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [shops, setShops] = useState([]);

    useEffect(() => {
        let active = true;

        api('/landing-page')
            .then((response) => {
                if (!active) return;
                setContent(response.data);
                setIsUnavailable(false);
                setLoadError('');
            })
            .catch((error) => {
                if (!active) return;
                if (error.status === 404) {
                    setIsUnavailable(true);
                    setLoadError('');
                    return;
                }
                setLoadError('Showing default content because live content could not be loaded.');
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        api('/landing-page/shops')
            .then((response) => {
                if (active) setShops(response.data);
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, []);

    if (isUnavailable) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                    <div className="mx-auto flex w-fit"><BrandMark name={fallbackContent.brand_name} /></div>
                    <h1 className="mt-6 text-2xl font-semibold tracking-tight">Website is being prepared</h1>
                    <p className="mt-2 text-sm text-slate-500">Please check back shortly. Staff can still open the secure sign in page.</p>
                    <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">
                        Go to sign in <FiArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const features = Array.isArray(content.features) && content.features.length ? content.features : fallbackContent.features;
    const brandName = content.brand_name || fallbackContent.brand_name;
    const primaryHref = user ? '/dashboard' : content.primary_cta_url || fallbackContent.primary_cta_url;
    const primaryLabel = user ? 'Open dashboard' : content.primary_cta_label || fallbackContent.primary_cta_label;
    const isInternalLink = primaryHref.startsWith('/');
    const PrimaryCta = isInternalLink ? Link : 'a';
    const primaryCtaProps = isInternalLink ? { to: primaryHref } : { href: primaryHref, target: '_blank', rel: 'noopener noreferrer' };
    const contacts = [
        content.contact_email ? { icon: FiMail, label: content.contact_email, href: `mailto:${content.contact_email}` } : null,
        content.contact_phone ? { icon: FiPhone, label: content.contact_phone, href: `tel:${content.contact_phone.replace(/\s/g, '')}` } : null,
        content.contact_address ? { icon: FiMapPin, label: content.contact_address } : null,
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <BrandMark name={brandName} />
                    <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
                        <a href="#features" className="transition hover:text-emerald-600">Features</a>
                        <a href="#shops" className="transition hover:text-emerald-600">Shops</a>
                        <a href="#about" className="transition hover:text-emerald-600">About</a>
                        <a href="#contact" className="transition hover:text-emerald-600">Contact</a>
                    </nav>
                    <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                        Sign in
                    </Link>
                </div>
            </header>

            <main>
                <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-950 text-white">
                    <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10" />
                    <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
                        <div>
                            {content.eyebrow && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-100 ring-1 ring-white/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                    {content.eyebrow}
                                </span>
                            )}
                            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                                {content.hero_title}
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-emerald-100 sm:text-lg">
                                {content.hero_description}
                            </p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <PrimaryCta {...primaryCtaProps} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-50">
                                    {primaryLabel} <FiArrowRight className="h-4 w-4" />
                                </PrimaryCta>
                                {content.secondary_cta_label && (
                                    <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                        {content.secondary_cta_label}
                                    </a>
                                )}
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-emerald-100/90">
                                {features.slice(0, 3).map((feature) => (
                                    <span key={feature.title} className="inline-flex items-center gap-2">
                                        <FiCheckCircle className="h-4 w-4 text-emerald-300" /> {feature.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative flex items-center justify-center py-4">
                            <div className="absolute inset-0 rounded-full bg-emerald-300/20 blur-3xl" />
                            <img src="/pos-software.svg" alt="Point of sale dashboard with sales chart, receipt and payment confirmation" className="relative w-full max-w-xl drop-shadow-2xl" />
                        </div>
                    </div>
                </section>

                <section id="features" className="bg-slate-50 py-20 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Features</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A better way to run daily retail.</h2>
                            <p className="mt-4 text-base leading-7 text-slate-600">From the sales counter to the stockroom, every part of your operation stays connected.</p>
                        </div>
                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <FeatureCard key={`${feature.title}-${index}`} feature={feature} index={index} />
                            ))}
                        </div>
                    </div>
                </section>

                {shops.length > 0 && (
                    <section id="shops" className="relative overflow-hidden bg-slate-50 py-20 sm:py-24">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-wrap items-end justify-between gap-6">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Locations</p>
                                    <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Our shops</h2>
                                    <p className="mt-4 text-base leading-7 text-slate-600">Every branch connected to the same system, the same tools and the same live data.</p>
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <FiHome className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums leading-none text-slate-900">
                                            {String(shops.length).padStart(2, '0')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">Connected branches</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {shops.map((shop) => (
                                    <article key={shop.id} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-emerald-300">
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 opacity-0 transition group-hover:opacity-100" />
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition group-hover:bg-emerald-600 group-hover:text-white">
                                                <FiHome className="h-5 w-5" />
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                                {shop.code}
                                            </span>
                                        </div>
                                        <h3 className="mt-6 text-md font-semibold tracking-tight text-slate-900">{shop.name}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Sales, stock and reporting in one connected workspace.
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-emerald-600">
                                            <FiCheckCircle className="h-4 w-4" /> Part of your network
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section id="about" className="py-20 sm:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                        <div className="relative flex items-center justify-center rounded-3xl bg-slate-50 p-10 ring-1 ring-slate-200">
                            <div className="absolute inset-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-transparent" />
                            <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">Today at a glance</span>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        ['Sales', '24,850'],
                                        ['Purchases', '12,400'],
                                        ['Products', '1,284'],
                                        ['Shops', '08'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-lg bg-slate-50 p-3">
                                            <div className="text-xs text-slate-500">{label}</div>
                                            <div className="mt-1 text-lg font-semibold">{value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex h-16 items-end gap-1.5">
                                    {[38, 52, 44, 68, 60, 82, 74, 90, 70, 86, 96, 78].map((height, index) => (
                                        <span key={index} className="flex-1 rounded-t bg-emerald-500/80" style={{ height: `${height}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Why {brandName}</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{content.showcase_title}</h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">{content.showcase_description}</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                                    Open your register <FiArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer id="contact" className="bg-slate-950 text-slate-300">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        <div>
                            <BrandMark name={brandName} inverse />
                            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{content.footer_text}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Contact</h3>
                            <div className="mt-4 space-y-3 text-sm">
                                {contacts.length ? contacts.map(({ icon: Icon, label, href }) => (
                                    href ? (
                                        <a key={label} href={href} className="flex items-center gap-2 text-slate-400 transition hover:text-white">
                                            <Icon className="h-4 w-4 shrink-0" /> {label}
                                        </a>
                                    ) : (
                                        <div key={label} className="flex items-center gap-2 text-slate-400">
                                            <Icon className="h-4 w-4 shrink-0" /> {label}
                                        </div>
                                    )
                                )) : (
                                    <p className="text-slate-500">Contact details are managed by your administrator.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Access</h3>
                            <div className="mt-4 space-y-3 text-sm">
                                <Link to="/login" className="block text-slate-400 transition hover:text-white">Staff sign in</Link>
                                <a href="#features" className="block text-slate-400 transition hover:text-white">View features</a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
                        © {new Date().getFullYear()} {brandName}. {content.footer_text}
                    </div>
                </div>
            </footer>

            {loadError && (
                <div role="status" className="fixed bottom-4 left-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm ring-1 ring-amber-200">
                    {loadError}
                </div>
            )}
        </div>
    );
}
