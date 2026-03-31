import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryIcon } from '../utils/categoryIcons';
import { ROUTES } from '../utils/routes';
import api from '../utils/api';
import CartDrawer from './CartDrawer';
import {
    Search,
    X,
    Wallet,
    Menu,
    ShieldCheck,
    ShoppingCart,
    Plus,
    ChevronDown,
    Check,
    Settings,
    Bell,
    Upload,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';


const HighlightText = ({ text = '', highlight = '' }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-emerald-100 font-bold text-emerald-900">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

function Navbar({ onToggleSidebar, onSelectCategory }) {
    const { user, logout, loading, isAdmin } = useContext(AuthContext);

    const cartCount = useCartStore((state) => state.cart?.items?.length || 0);
    const addToCart = useCartStore((state) => state.addToCart);

    const [catDropOpen, setCatDropOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [addedSku, setAddedSku] = useState(null);

    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const hoverTimeout = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 250);
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
            const res = await api.get(`/products?search=${debouncedSearch}&limit=5`);
            return res.data.data;
        },
        enabled: debouncedSearch.trim().length >= 2,
    });

    const displayCategories = dbCategories.map((cat) => {
        const visual = getCategoryIcon(cat.name);
        return { ...cat, Icon: visual.Icon, color: visual.color, iconColor: visual.iconColor };
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

    const executeSearch = (term) => {
        if (!term.trim()) return;
        setIsSearchOpen(false);
        setSearchInput(term);
        navigate(`/search?q=${encodeURIComponent(term.trim())}`);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setDebouncedSearch('');
        inputRef.current?.focus();
    };

    const handleQuickAdd = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setAddedSku(product._id);
        await addToCart(product._id, product.moq || 10, 'WHOLESALE', 0);
        setTimeout(() => setAddedSku(null), 1500);
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 font-sans shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {}
                    <div className="flex items-center gap-6 xl:gap-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onToggleSidebar}
                                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <Menu size={20} strokeWidth={2.5} />
                            </button>

                            {}
                            <Link to={ROUTES.HOME} className="group flex items-center gap-2">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-7 w-auto transition-transform group-hover:scale-105"
                                />
                                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                    Sovely{' '}
                                    <span className="text-sm font-semibold text-slate-500">
                                        B2B
                                    </span>
                                </span>
                            </Link>
                        </div>

                        <ul className="hidden items-center gap-6 md:flex">
                            <li
                                className="relative"
                                onMouseEnter={() => {
                                    clearTimeout(hoverTimeout.current);
                                    setCatDropOpen(true);
                                }}
                                onMouseLeave={() => {
                                    hoverTimeout.current = setTimeout(
                                        () => setCatDropOpen(false),
                                        150
                                    );
                                }}
                            >
                                <button
                                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${catDropOpen ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Categories
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={2.5}
                                        className={`transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {catDropOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                            className="absolute top-full -left-4 mt-3 w-[600px] origin-top-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                                        >
                                            <div className="mb-3 px-2">
                                                <h4 className="text-[10px] font-black tracking-[0.1em] text-slate-400 uppercase">
                                                    Browse Collections
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1">
                                                {displayCategories.map((cat, i) => (
                                                    <button
                                                        key={cat._id || i}
                                                        onClick={() => {
                                                            setCatDropOpen(false);
                                                            if (onSelectCategory)
                                                                onSelectCategory(cat.name);
                                                            navigate(
                                                                `/search?category=${encodeURIComponent(cat.name)}`
                                                            );
                                                        }}
                                                        className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:bg-slate-50 hover:shadow-sm"
                                                    >
                                                        <span
                                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-transform group-hover:scale-110 group-hover:bg-white group-hover:shadow-md"
                                                            style={{ color: cat.iconColor }}
                                                        >
                                                            <cat.Icon size={18} strokeWidth={2.5} />
                                                        </span>
                                                        <span className="truncate text-left text-[11px] font-extrabold text-slate-700 group-hover:text-emerald-600">
                                                            {cat.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </li>
                            <li>
                                {isAdmin ? (
                                    <Link
                                        to={ROUTES.ADMIN}
                                        state={{ tab: 'bulk-upload' }}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-700"
                                    >
                                        <Upload size={14} /> Quick Upload
                                    </Link>
                                ) : (
                                    <Link
                                        to={ROUTES.QUICK_ORDER}
                                        className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                                    >
                                        Quick Order
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </div>

                    {}
                    <div ref={searchRef} className="relative hidden max-w-2xl flex-1 px-4 sm:block">
                        <div
                            className={`flex w-full items-center rounded-lg border px-3 py-2 transition-all ${isSearchOpen ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}`}
                        >
                            <Search
                                size={16}
                                className={isSearchOpen ? 'text-emerald-600' : 'text-slate-400'}
                                strokeWidth={2.5}
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search SKUs, products, or categories..."
                                className="w-full border-none bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') executeSearch(searchInput);
                                }}
                            />
                            {!searchInput && (
                                <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold text-slate-400 lg:flex">
                                    ⌘K
                                </kbd>
                            )}
                            {searchInput && (
                                <button
                                    onClick={handleClearSearch}
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-900"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        {}
                        <AnimatePresence>
                            {isSearchOpen && searchInput.trim().length >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-4 left-4 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                                >
                                    {isSearching ? (
                                        <div className="flex items-center justify-center p-6 text-sm font-semibold text-slate-500">
                                            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
                                            Searching catalog...
                                        </div>
                                    ) : liveSearchData?.products?.length > 0 ? (
                                        <div className="flex flex-col">
                                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                                Products
                                            </div>
                                            {liveSearchData.products.map((product) => (
                                                <div
                                                    key={product._id}
                                                    className="group flex items-center justify-between border-b border-slate-100 p-2.5 px-4 transition-colors hover:bg-slate-50"
                                                >
                                                    <div
                                                        className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden"
                                                        onClick={() => {
                                                            setIsSearchOpen(false);
                                                            navigate(`/product/${product._id}`);
                                                        }}
                                                    >
                                                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                                                            <img
                                                                src={
                                                                    product.images?.[0]?.url ||
                                                                    'https://via.placeholder.com/40'
                                                                }
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                                                                <HighlightText
                                                                    text={product.title}
                                                                    highlight={debouncedSearch}
                                                                />
                                                            </span>
                                                            <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                                <span>
                                                                    SKU:{' '}
                                                                    <HighlightText
                                                                        text={product.sku || 'N/A'}
                                                                        highlight={debouncedSearch}
                                                                    />
                                                                </span>
                                                                <span className="text-slate-300">
                                                                    |
                                                                </span>
                                                                <span className="font-bold text-slate-900">
                                                                    ₹
                                                                    {(
                                                                        product.platformSellPrice ||
                                                                        product.dropshipBasePrice
                                                                    ).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 pl-4">
                                                        <div className="hidden flex-col items-end sm:flex">
                                                            <span className="text-xs font-bold text-slate-500">
                                                                MOQ: {product.moq}
                                                            </span>
                                                            {product.margin >= 30 && (
                                                                <span className="text-[10px] font-bold text-emerald-600">
                                                                    High Margin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) =>
                                                                handleQuickAdd(e, product)
                                                            }
                                                            disabled={addedSku === product._id}
                                                            className={`flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${addedSku === product._id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white'}`}
                                                        >
                                                            {addedSku === product._id ? (
                                                                <>
                                                                    <Check
                                                                        size={14}
                                                                        className="mr-1"
                                                                    />{' '}
                                                                    Added
                                                                </>
                                                            ) : (
                                                                'Add'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => executeSearch(debouncedSearch)}
                                                className="w-full bg-slate-50 p-3 text-xs font-bold text-emerald-600 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                                            >
                                                View all {liveSearchData.pagination?.total || 0}{' '}
                                                results &rarr;
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-sm font-semibold text-slate-500">
                                            No products found for "{debouncedSearch}"
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        {isAdmin && (
                            <Link
                                to={ROUTES.ADMIN}
                                className="hidden items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-6 py-2.5 text-white transition-all hover:bg-slate-800 hover:shadow-lg sm:flex"
                            >
                                <ShieldCheck size={18} strokeWidth={2.5} />{' '}
                                <span className="text-sm font-black tracking-wide">
                                    ADMIN CONSOLE
                                </span>
                            </Link>
                        )}

                        {!isAdmin && user && (
                            <button
                                onClick={() => navigate(ROUTES.WALLET)}
                                className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                                title="Wallet Balance"
                            >
                                <Wallet
                                    size={18}
                                    strokeWidth={2.5}
                                    className="text-slate-400 transition-colors group-hover:text-emerald-600"
                                />
                                <span className="text-xs font-black text-slate-700 group-hover:text-emerald-700">
                                    ₹{(user.walletBalance || 0).toLocaleString('en-IN')}
                                </span>
                            </button>
                        )}

                        {!isAdmin && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                title="Cart"
                            >
                                <ShoppingCart size={20} strokeWidth={2} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <div className="ml-1 hidden border-l border-slate-200 pl-4 lg:block">
                            {loading ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
                            ) : user ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={ROUTES.MY_ACCOUNT}
                                        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-100 shadow-sm transition-transform hover:scale-105"
                                    >
                                        {user?.avatar ? (
                                            <img
                                                src={`http://localhost:8014${user.avatar}`}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-500">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="flex flex-col">
                                        <Link
                                            to={ROUTES.MY_ACCOUNT}
                                            className="text-sm font-bold text-slate-900 hover:text-emerald-600"
                                        >
                                            {user?.companyName || user?.name?.split(' ')[0]}
                                        </Link>
                                        <span className="text-xs font-medium text-slate-500">
                                            {user?.accountType === 'B2B'
                                                ? 'Business Account'
                                                : 'Personal Account'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
                                    >
                                        Log out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={ROUTES.LOGIN}
                                        className="text-sm font-bold text-slate-600 hover:text-slate-900"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to={ROUTES.SIGNUP}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </nav>
    );
}

export default Navbar;
