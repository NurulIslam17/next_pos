import { useEffect, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiLayers, FiMail, FiMapPin, FiPackage, FiPhone, FiShoppingCart, FiTrendingUp, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

const fallbackContent = {
    brand_name: 'My POS',
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
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${inverse ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-indigo-600 text-white'}`}>
                <FiLayers className="h-5 w-5" />
            </span>
            <span className={`text-lg font-semibold tracking-tight ${inverse ? 'text-white' : 'text-slate-900'}`}>{name}</span>
        </div>
    );
}

function Receipt({ brandName }) {
    const lines = [
        ['Bamboo tray', '1', '420.00'],
        ['Cup pirich', '6', '576.00'],
        ['Panir glass', '2', '120.00'],
    ];

    return (
        <div className="w-72 rotate-3 rounded-lg bg-white p-5 font-mono text-xs text-slate-700 shadow-2xl ring-1 ring-slate-200">
            <div className="text-center">
                <div className="text-sm font-bold tracking-widest">{brandName.toUpperCase()}</div>
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
                {Array.from({ length: 36 }).map((_, index) => (
                    <span key={index} className="bg-slate-800" style={{ width: index % 3 === 0 ? 3 : 1.5, height: `${60 + ((index * 37) % 40)}%` }} />
                ))}
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">THANK YOU · PLEASE COME AGAIN</div>
        </div>
    );
}

function FeatureCard({ feature, index }) {
    const Icon = featureIcons[index % featureIcons.length];

    return (
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
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
                    <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500">
                        Go to sign in <FiArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const features = Array.isArray(content.features) && content.features.length ? content.features : fallbackContent.features;
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
                    <BrandMark name={content.brand_name || fallbackContent.brand_name} />
                    <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
                        <a href="#features" className="transition hover:text-indigo-600">Features</a>
                        <a href="#shops" className="transition hover:text-indigo-600">Shops</a>
                        <a href="#about" className="transition hover:text-indigo-600">About</a>
                        <a href="#contact" className="transition hover:text-indigo-600">Contact</a>
                    </nav>
                    <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                        Sign in
                    </Link>
                </div>
            </header>

            <main>
                <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 text-white">
                    <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10" />
                    <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
                        <div>
                            {content.eyebrow && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-indigo-100 ring-1 ring-white/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                    {content.eyebrow}
                                </span>
                            )}
                            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                                {content.hero_title}
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
                                {content.hero_description}
                            </p>
                            <div className="mt-9 flex flex-wrap gap-3">
                                <PrimaryCta {...primaryCtaProps} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-800 shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-50">
                                    {primaryLabel} <FiArrowRight className="h-4 w-4" />
                                </PrimaryCta>
                                {content.secondary_cta_label && (
                                    <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                        {content.secondary_cta_label}
                                    </a>
                                )}
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-indigo-100/90">
                                {features.slice(0, 3).map((feature) => (
                                    <span key={feature.title} className="inline-flex items-center gap-2">
                                        <FiCheckCircle className="h-4 w-4 text-emerald-300" /> {feature.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative flex items-center justify-center py-4">
                            <div className="absolute inset-0 rounded-full bg-indigo-300/20 blur-3xl" />
                            <Receipt brandName={content.brand_name || fallbackContent.brand_name} />
                        </div>
                    </div>
                </section>

                <section id="features" className="bg-slate-50 py-20 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Features</p>
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
                    <section id="shops" className="bg-white py-20 sm:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Locations</p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Our shops</h2>
                                <p className="mt-4 text-base leading-7 text-slate-600">Every branch connected to the same system.</p>
                            </div>
                            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {shops.map((shop) => (
                                    <div key={shop.id} className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:ring-indigo-300">
                                        <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">{shop.code}</span>
                                        <h3 className="mt-4 text-base font-semibold text-slate-900">{shop.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section id="about" className="py-20 sm:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                        <div className="relative flex items-center justify-center rounded-3xl bg-slate-50 p-10 ring-1 ring-slate-200">
                            <div className="absolute inset-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-transparent" />
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
                                        <span key={index} className="flex-1 rounded-t bg-indigo-500/80" style={{ height: `${height}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Why {content.brand_name}</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{content.showcase_title}</h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">{content.showcase_description}</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
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
                            <BrandMark name={content.brand_name || fallbackContent.brand_name} inverse />
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
                        © {new Date().getFullYear()} {content.brand_name}. {content.footer_text}
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
