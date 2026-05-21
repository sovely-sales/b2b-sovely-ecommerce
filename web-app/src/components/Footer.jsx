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
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
                    {/* Brand & Social (2 columns) */}
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

                        {/* Social Links */}
                        <div className="flex items-center gap-3 pt-2">
                            {[
                                { Icon: Facebook, label: 'Facebook', href: '#' },
                                { Icon: Twitter, label: 'Twitter', href: '#' },
                                { Icon: Instagram, label: 'Instagram', href: '#' },
                                {
                                    Icon: Linkedin,
                                    label: 'LinkedIn',
                                    href: 'https://www.linkedin.com/company/113337675',
                                },
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

                    {/* QUICK LINKS */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-emerald-500 uppercase">
                            Quick Links
                        </h4>
                        <ul className="space-y-3 text-sm font-medium text-white">
                            {[
                                { label: 'What Is Dropshipping', path: '#' },
                                { label: 'Dropshipping', path: '#' },
                                { label: 'Franchise', path: '#' },
                                { label: 'Become Vendor', path: '#' },
                                { label: 'Create a Ticket', path: '#' },
                                { label: 'Wholesale login', path: ROUTES.LOGIN },
                                { label: 'Wholesale Signup', path: ROUTES.REGISTER },
                                { label: 'VIP Customers', path: '#' },
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

                    {/* POLICIES */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-emerald-500 uppercase">
                            Policies
                        </h4>
                        <ul className="space-y-3 text-sm font-medium text-white">
                            {[
                                { label: 'About Us', path: ROUTES.ABOUT },
                                { label: 'Contact Us', path: ROUTES.CONTACT_US },
                                { label: 'Terms & Conditions', path: '/terms' },
                                { label: 'Shipping Policy', path: ROUTES.SHIPPING },
                                { label: 'Return and Refund Policy', path: ROUTES.RETURNS },
                                { label: 'Payment & Security', path: '#' },
                                { label: 'Privacy Policy', path: ROUTES.PRIVACY },
                                { label: 'Order Cancellation Policy', path: '#' },
                                { label: 'Grievance Redressal Policy', path: '#' },
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

                    {/* OTHER LINKS */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-emerald-500 uppercase">
                            Other Links
                        </h4>
                        <ul className="space-y-3 text-sm font-medium text-white">
                            {[
                                { label: 'Influencer Form', path: '#' },
                                { label: 'Blogs', path: '#' },
                                { label: 'DMCA', path: '#' },
                                { label: 'Affiliate', path: '#' },
                                { label: 'FAQs', path: '/faq' },
                                { label: 'Career', path: '#' },
                                { label: 'Shipment Tracking', path: '#' },
                                { label: 'Store Locator', path: '#' },
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

                    {/* DROP SHIPPING WITH SOVELY */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black tracking-widest text-emerald-500 uppercase">
                            Drop Shipping With Sovely
                        </h4>
                        <ul className="space-y-3 text-sm font-medium text-white">
                            {[
                                { label: 'Sovely Dropshipping', path: '#' },
                                { label: 'All Website Plan', path: '#' },
                                { label: 'Shopify Website', path: '#' },
                                { label: 'Self Serve Plan', path: '#' },
                                { label: 'B2B Drop Shipping', path: '#' },
                                { label: 'Reseller Plan', path: '#' },
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
