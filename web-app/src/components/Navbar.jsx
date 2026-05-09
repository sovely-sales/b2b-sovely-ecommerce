import { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../utils/routes';
import api from '../utils/api';
import { useCartStore } from '../store/cartStore';
import {
    Search,
    X,
    ShoppingCart,
    User,
    Check,
    LayoutGrid,
    Bell,
    AlertOctagon,
    TrendingUp,
    Truck,
    ShieldCheck,
    Box,
    Clock,
    Wallet,
    Headphones,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const HighlightText = ({ text = '', highlight = '' }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-indigo-100 font-bold text-indigo-900">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const getNotificationStyles = (type) => {
    switch (type) {
        case 'ORDER_APPROVAL_REQUIRED':
            return { icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100' };
        case 'ORDER_APPROVED':
        case 'LOGISTICS':
            return { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100' };
        case 'NDR_ALERT':
            return { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-100' };
        case 'WALLET_UPDATE':
        case 'FINANCE':
            return { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' };
        case 'ORDER_REJECTED':
            return { icon: X, color: 'text-red-600', bg: 'bg-red-100' };
        default:
            return { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100' };
    }
};

function Navbar() {
    const { user, loading, isAdmin } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const cart = useCartStore((state) => state.cart);
    const fetchCart = useCartStore((state) => state.fetchCart);
    const cartCount = cart?.items?.length || 0;
    const addToCart = useCartStore((state) => state.addToCart);

    const [isScrolled, setIsScrolled] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [addedSku, setAddedSku] = useState(null);

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // --- NEW: Fetch Real Notifications ---
    const { data: notificationsData } = useQuery({
        queryKey: ['notifications', user?._id],
        queryFn: async () => {
            const res = await api.get('/users/notifications');
            return res.data.data;
        },
        enabled: !!user,
        refetchInterval: 30000,
    });

    const notifications = useMemo(() => notificationsData || [], [notificationsData]);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.put('/users/notifications/read');
        },
        onSuccess: () => {
            queryClient.setQueryData(['notifications', user?._id], (oldData) =>
                oldData?.map((n) => ({ ...n, isRead: true }))
            );
        },
    });

    useEffect(() => {
        if (user && !isAdmin && !cart) {
            fetchCart();
        }
    }, [user, isAdmin, cart, fetchCart]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable
            ) {
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
                return;
            }
            if (inputRef.current) {
                inputRef.current.focus();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 250);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: liveSearchData, isFetching: isSearching } = useQuery({
        queryKey: ['liveSearch', debouncedSearch],
        queryFn: async () => {
            const res = await api.get(`/products?search=${debouncedSearch}&limit=5`);
            return res.data.data;
        },
        enabled: debouncedSearch.trim().length >= 2,
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target))
                setIsSearchOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
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

        if (!user) {
            navigate(ROUTES.LOGIN);
            return;
        }

        setAddedSku(product._id);
        const res = await addToCart(product._id, product.moq || 10, 'DROPSHIP', 0);
        if (res.success) {
            navigate(ROUTES.MY_ACCOUNT);
        }
        setTimeout(() => setAddedSku(null), 1500);
    };

    const handleNotificationClick = (notif) => {
        setIsNotifOpen(false);
        if (notif.referenceData?.actionUrl) {
            navigate(notif.referenceData.actionUrl);
        }
    };

    return (
        <>
            <header
                className={`fixed inset-x-0 z-50 font-sans transition-all duration-300 ease-in-out ${isScrolled ? 'top-4 px-4 sm:px-6' : 'top-0 px-0'}`}
            >
                <nav
                    className={`mx-auto flex h-14 items-center justify-between gap-4 transition-all duration-300 ease-in-out ${isScrolled ? 'max-w-5xl rounded-full border border-slate-200/60 bg-white/85 px-6 shadow-lg backdrop-blur-md' : 'max-w-6xl rounded-b-2xl border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8'}`}
                >
                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                            to={ROUTES.HOME}
                            className={`flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isScrolled ? 'pointer-events-none w-0 opacity-0' : 'w-28 opacity-100'}`}
                        >
                            <img
                                src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                alt="Sovely Logo"
                                className="h-6 w-auto shrink-0"
                            />
                            <span className="text-xl font-black tracking-tight text-slate-900">
                                Sovely
                            </span>
                        </Link>
                        <Link
                            to={ROUTES.CATALOG}
                            className={`hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 sm:flex ${isScrolled ? 'text-slate-900' : 'text-slate-600'}`}
                        >
                            <LayoutGrid size={18} /> Catalog
                        </Link>
                    </div>

                    <div
                        ref={searchRef}
                        className={`relative hidden w-full flex-1 transition-all duration-300 lg:block ${isScrolled ? 'max-w-md' : 'max-w-xl'}`}
                    >
                        <div
                            className={`flex w-full items-center overflow-hidden rounded-full border transition-all ${isSearchOpen ? 'border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
                        >
                            <div className="pr-2 pl-4 text-slate-400">
                                <Search size={16} strokeWidth={2.5} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={
                                    isScrolled
                                        ? 'Type to search...'
                                        : 'Search SKUs, products, or brands...'
                                }
                                className={`w-full bg-transparent py-2 text-sm font-bold text-slate-900 transition-all outline-none placeholder:font-medium placeholder:text-slate-400`}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchInput)}
                            />

                            {searchInput && (
                                <button
                                    onClick={handleClearSearch}
                                    className="px-4 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {isSearchOpen && searchInput.trim().length >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.1 }}
                                    className={`absolute right-0 left-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${isScrolled ? 'top-full mt-4' : 'top-full mt-2'}`}
                                >
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm font-medium text-slate-500">
                                            Searching catalog...
                                        </div>
                                    ) : liveSearchData?.products?.length > 0 ? (
                                        <div className="flex flex-col">
                                            {liveSearchData.products.map((product) => (
                                                <div
                                                    key={product._id}
                                                    className="group flex items-center justify-between border-b border-slate-100 p-3 hover:bg-slate-50"
                                                >
                                                    <div
                                                        className="flex flex-1 cursor-pointer items-center gap-3"
                                                        onClick={() => {
                                                            setIsSearchOpen(false);
                                                            navigate(`/product/${product._id}`);
                                                        }}
                                                    >
                                                        <img
                                                            src={
                                                                product.images?.[0]?.url ||
                                                                'https://via.placeholder.com/40'
                                                            }
                                                            alt=""
                                                            className="h-10 w-10 rounded border border-slate-200 object-cover"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                                                                <HighlightText
                                                                    text={product.title}
                                                                    highlight={debouncedSearch}
                                                                />
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500">
                                                                SKU:{' '}
                                                                <HighlightText
                                                                    text={product.sku || 'N/A'}
                                                                    highlight={debouncedSearch}
                                                                />{' '}
                                                                | ₹
                                                                {(
                                                                    product.platformSellPrice ||
                                                                    product.dropshipBasePrice
                                                                ).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleQuickAdd(e, product)}
                                                        disabled={addedSku === product._id}
                                                        className={`ml-4 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${addedSku === product._id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white'}`}
                                                    >
                                                        {addedSku === product._id ? (
                                                            <span className="flex items-center gap-1">
                                                                <Check size={14} /> Added
                                                            </span>
                                                        ) : (
                                                            'Quick Add'
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => executeSearch(debouncedSearch)}
                                                className="w-full bg-slate-50 p-3 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                                            >
                                                View all {liveSearchData.pagination?.total || 0}{' '}
                                                results &rarr;
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm font-medium text-slate-500">
                                            No products found for "{debouncedSearch}"
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        {user && user.accountType === 'B2B' && (
                            <Link
                                to={ROUTES.MY_ACCOUNT}
                                state={{ tab: 'WALLET' }}
                                className={`flex items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'}`}
                            >
                                <Wallet size={20} strokeWidth={2.5} />
                                <span className="hidden text-sm sm:block">
                                    ₹
                                    {user.walletBalance?.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                    }) || '0.00'}
                                </span>
                            </Link>
                        )}
                        {user && (
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className={`relative flex items-center justify-center rounded-full p-2 transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'} ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                >
                                    <Bell size={20} strokeWidth={2.5} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isNotifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                                                <h3 className="font-extrabold text-slate-900">
                                                    Notifications
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={() => markAsReadMutation.mutate()}
                                                        className="cursor-pointer border-none bg-transparent text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="custom-scrollbar max-h-[350px] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-sm font-bold text-slate-400">
                                                        You're all caught up!
                                                    </div>
                                                ) : (
                                                    notifications.map((notif) => {
                                                        const styles = getNotificationStyles(
                                                            notif.type
                                                        );
                                                        const Icon = styles.icon;

                                                        let timeAgo = '';
                                                        try {
                                                            timeAgo = formatDistanceToNow(
                                                                new Date(notif.createdAt),
                                                                { addSuffix: true }
                                                            );
                                                        } catch (e) {
                                                            timeAgo = 'Recently';
                                                        }

                                                        return (
                                                            <div
                                                                key={notif._id}
                                                                onClick={() =>
                                                                    handleNotificationClick(notif)
                                                                }
                                                                className={`flex cursor-pointer gap-3 border-b border-slate-50 p-4 transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-slate-50/50' : 'bg-white'}`}
                                                            >
                                                                <div
                                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.bg} ${styles.color}`}
                                                                >
                                                                    <Icon
                                                                        size={14}
                                                                        strokeWidth={2.5}
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p
                                                                        className={`mb-0.5 text-xs font-extrabold ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}
                                                                    >
                                                                        {notif.title}
                                                                    </p>
                                                                    <p
                                                                        className={`text-xs leading-snug ${!notif.isRead ? 'font-bold text-slate-700' : 'font-medium text-slate-500'}`}
                                                                    >
                                                                        {notif.message}
                                                                    </p>
                                                                    <p className="mt-1 flex items-center gap-1 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                                        <Clock size={10} />{' '}
                                                                        {timeAgo}
                                                                    </p>
                                                                </div>
                                                                {!notif.isRead && (
                                                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"></div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <div className="border-t border-slate-100 bg-slate-50 p-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        setIsNotifOpen(false);
                                                        navigate(ROUTES.MY_ACCOUNT);
                                                    }}
                                                    className="text-xs font-bold text-slate-500 transition-colors hover:text-indigo-600"
                                                >
                                                    View Alert Preferences
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {!isAdmin && (
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Link
                                    to={`${ROUTES.ORDERS}?tab=CART`}
                                    className={`flex items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'}`}
                                >
                                    <div className="relative">
                                        <ShoppingCart size={20} strokeWidth={2.5} />
                                        {cartCount > 0 && (
                                            <motion.span
                                                key={cartCount}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-2 ring-white"
                                            >
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </motion.span>
                                        )}
                                    </div>
                                    <span className="hidden text-sm sm:block">Cart</span>
                                </Link>

                                <Link
                                    to={`${ROUTES.ORDERS}?tab=HISTORY`}
                                    className={`flex items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'}`}
                                >
                                    <LayoutGrid size={20} strokeWidth={2.5} />
                                    <span className="hidden text-sm sm:block">Operations</span>
                                </Link>

                                <Link
                                    to={ROUTES.MY_ACCOUNT}
                                    state={{ tab: 'SUPPORT' }}
                                    className={`flex items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'}`}
                                >
                                    <Headphones size={20} strokeWidth={2.5} />
                                    <span className="hidden text-sm sm:block">Support</span>
                                </Link>
                            </div>
                        )}

                        <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block"></div>

                        {loading ? (
                            <div className="mx-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                        ) : user ? (
                            <Link
                                to={ROUTES.MY_ACCOUNT}
                                className={`flex items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${isScrolled ? 'text-slate-800' : 'text-slate-600'}`}
                            >
                                <User size={20} strokeWidth={2.5} />
                                <span className="hidden text-sm sm:block">Account</span>
                            </Link>
                        ) : (
                            <button
                                onClick={() => navigate(ROUTES.LOGIN)}
                                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </nav>
            </header>
            <div className="h-14 w-full shrink-0" />
        </>
    );
}

export default Navbar;
