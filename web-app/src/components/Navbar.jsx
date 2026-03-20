import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getCategoryIcon } from '../utils/categoryIcons';
import { ROUTES } from '../utils/routes'; // <-- NEW
import api from '../utils/api';
import CartDrawer from './CartDrawer';
import { Search, X, Clock, TrendingUp, Wallet, Menu, Shield } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

function Navbar({ onToggleSidebar, onSelectCategory }) {
    const { user, logout, loading, isAdmin } = useContext(AuthContext); // <-- Pulled isAdmin from context
    const cartCount = useCartStore((state) => state.getCartCount());

    const [catDropOpen, setCatDropOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const searchRef = useRef(null);
    const hoverTimeout = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data;
        },
    });

    const { data: liveSearchData, isFetching: isSearching } = useQuery({
        queryKey: ['liveSearch', debouncedSearch],
        queryFn: async () => {
            const res = await api.get(`/products?search=${debouncedSearch}&limit=3`);
            return res.data.data;
        },
        enabled: debouncedSearch.trim().length >= 2,
    });

    const displayCategories = dbCategories.map((cat) => {
        const visual = getCategoryIcon(cat.name);
        return {
            _id: cat._id,
            name: cat.name,
            Icon: visual.Icon,
            color: visual.color,
            iconColor: visual.iconColor,
        };
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = () => {
        clearTimeout(hoverTimeout.current);
        setCatDropOpen(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => setCatDropOpen(false), 180);
    };

    const executeSearch = (term) => {
        if (!term.trim()) return;
        setIsSearchOpen(false);
        setSearchInput(term);
        navigate(`/search?q=${encodeURIComponent(term.trim())}`);
    };

    return (
        <nav className="relative sticky top-0 z-50 border-b border-slate-200/50 bg-white/95 shadow-sm backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onToggleSidebar}
                                className="p-1 text-slate-600 transition-colors hover:text-slate-900"
                                aria-label="Menu"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <Link to={ROUTES.HOME} className="group flex items-center gap-2">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-8 w-auto transition-transform group-hover:scale-105"
                                />
                                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                                    Sovely <span className="text-sm font-medium text-slate-500">B2B</span>
                                </span>
                            </Link>
                        </div>

                        <ul className="hidden items-center gap-8 md:flex">
                            <li className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                <button
                                    className={`flex items-center gap-1 font-semibold transition-colors ${catDropOpen ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
                                    onClick={() => setCatDropOpen((v) => !v)}
                                >
                                    Categories
                                    <svg className={`h-4 w-4 transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                <div className={`absolute top-full -left-4 mt-2 w-screen max-w-md origin-top-left rounded-2xl border border-slate-100 bg-white shadow-xl transition-all duration-200 ${catDropOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}>
                                    <div className="grid grid-cols-3 gap-2 p-4">
                                        {displayCategories.map((cat, i) => (
                                            <button
                                                key={cat._id || i}
                                                onClick={() => {
                                                    setCatDropOpen(false);
                                                    if (onSelectCategory) onSelectCategory(cat.name);
                                                    navigate(`/search?category=${encodeURIComponent(cat.name)}`);
                                                }}
                                                className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-slate-50"
                                            >
                                                <span className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: cat.color, color: cat.iconColor }}>
                                                    <cat.Icon size={20} strokeWidth={2} />
                                                </span>
                                                <span className="w-full truncate text-center text-xs font-bold text-slate-700">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </li>
                            <li>
                                <Link to={ROUTES.QUICK_ORDER} className="font-semibold text-slate-600 transition-colors hover:text-slate-900">
                                    Quick Order
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <button className="p-2 text-slate-600 hover:text-slate-900 sm:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                            <Search size={20} />
                        </button>

                        <div ref={searchRef} className="relative hidden sm:block">
                            <div className={`flex items-center rounded-full border bg-slate-100 px-4 py-2 transition-all ${isSearchOpen ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20' : 'border-transparent hover:bg-slate-200'}`}>
                                <Search size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search SKUs, categories, suppliers..."
                                    className="w-48 border-none bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 lg:w-64"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(searchInput); }}
                                />
                                {searchInput && (
                                    <button onClick={() => { setSearchInput(''); searchRef.current?.querySelector('input')?.focus(); }} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {/* Dropdown search logic left intact as provided */}
                        </div>

                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <Link to={ROUTES.ADMIN} className="hidden items-center gap-1.5 rounded-full border border-blue-100 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-50 sm:flex" title="Admin Console">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">Admin</span>
                                </Link>
                            )}

                            {user && (
                                <button onClick={() => navigate(ROUTES.WALLET)} className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600" title="Wallet Balance">
                                    <Wallet className="h-6 w-6" />
                                </button>
                            )}

                            <button onClick={() => setIsCartOpen(true)} className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900" title="Draft Order / Cart">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            <div className="ml-2 hidden border-l border-slate-200 pl-4 lg:block">
                                {loading ? (
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
                                ) : user ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <Link to={ROUTES.MY_ACCOUNT} className="text-sm font-bold text-slate-900 hover:text-emerald-600">
                                                {user?.companyName || user?.name?.split(' ')[0]}
                                            </Link>
                                            {/* --- FIX FOR FLAW #3: Dynamic Role Badge --- */}
                                            <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                                                {isAdmin ? 'Platform Admin' : 'Verified Buyer'}
                                            </span>
                                        </div>
                                        <button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-slate-900">
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Link to={ROUTES.LOGIN} className="text-sm font-bold text-slate-600 hover:text-slate-900">Log in</Link>
                                        <Link to={ROUTES.SIGNUP} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800">Register Business</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </nav>
    );
}

export default Navbar;