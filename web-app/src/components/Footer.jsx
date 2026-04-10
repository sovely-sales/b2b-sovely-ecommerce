import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/routes';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

function Footer() {
    return (
        <footer
            className="border-t border-slate-800 bg-slate-950 pt-20 pb-8 font-sans text-slate-400 selection:bg-emerald-500/30"
            id="footer"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {}
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
                    {}
                    <div className="space-y-6 lg:col-span-2">
                        <Link to={ROUTES.HOME} className="group flex w-fit items-center gap-3">
                            <div className="rounded-lg bg-white p-1.5 shadow-lg shadow-white/10 transition-transform group-hover:scale-105">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-6 w-auto"
                                />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-white">
                                Sovely<span className="text-emerald-500">.</span>
                            </span>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed font-medium text-slate-400">
                            The intelligent standard for B2B procurement. Powering modern retail
                            operations, wholesale distribution, and frictionless dropshipping
                            pan-India.
                        </p>

                        {}
                        <div className="flex items-center gap-3 pt-2">
                            {[
                                { Icon: Facebook, label: 'Facebook', href: '#' },
                                { Icon: Twitter, label: 'Twitter', href: '#' },
                                { Icon: Instagram, label: 'Instagram', href: '#' },
                                { Icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/113337675' },
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href || '#'}
                                    target={social.href && social.href !== '#' ? '_blank' : undefined}
                                    rel={social.href && social.href !== '#' ? 'noopener noreferrer' : undefined}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    aria-label={social.label}
                                >
                                    <social.Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-white uppercase">
                            Company
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            {[
                                { label: 'About Sovely', path: ROUTES.ABOUT },
                                { label: 'Our Services', path: ROUTES.SERVICES },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={link.path}
                                        className="group inline-flex items-center gap-2 transition-all hover:translate-x-1 hover:text-emerald-400"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-white uppercase">
                            Support
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            {[
                                { label: 'Help Center', path: ROUTES.HELP_CENTER },
                                { label: 'FAQs', path: '/faq' },
                                { label: 'Contact Us', path: ROUTES.CONTACT_US },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={link.path}
                                        className="group inline-flex items-center gap-2 transition-all hover:translate-x-1 hover:text-emerald-400"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-white uppercase">
                            Operations
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            {[
                                { label: 'Shipping Policy', path: ROUTES.SHIPPING },
                                { label: 'Returns & Refunds', path: ROUTES.RETURNS },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={link.path}
                                        className="group inline-flex items-center gap-2 transition-all hover:translate-x-1 hover:text-emerald-400"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {}
                <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-800/60 pt-6 md:flex-row">
                    <p className="text-xs font-medium">
                        © {new Date().getFullYear()} Sovely B2B Network. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-xs font-bold tracking-wide">
                        <Link to="/terms" className="transition-colors hover:text-white">
                            Terms of Service
                        </Link>
                        <Link to={ROUTES.PRIVACY} className="transition-colors hover:text-white">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
