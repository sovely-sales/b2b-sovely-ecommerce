import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { WishlistContext } from '../WishlistContext';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi';
import { getCategoryIcon } from '../utils/categoryIcons';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

function Navbar({ onToggleSidebar, onSelectCategory }) {
    const { user, logout, loading } = useContext(AuthContext);
    const { wishlistItems } = useContext(WishlistContext);
    const cartItems = useCartStore((state) => state.cartItems);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [catDropOpen, setCatDropOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const searchRef = useRef(null);
    const dropRef = useRef(null);
    const hoverTimeout = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: productApi.getCategories,
    });

    const { data: liveSearchData, isFetching: isSearching } = useQuery({
        queryKey: ['liveSearch', debouncedSearch],
        queryFn: () => productApi.getProducts({ query: debouncedSearch, limit: 3 }),
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
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    ></path>
                                </svg>
                            </button>
                            <Link to="/" className="group flex items-center gap-2">
                                <img
                                    src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png"
                                    alt="Sovely Logo"
                                    className="h-8 w-auto transition-transform group-hover:scale-105"
                                />
                                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                                    Sovely
                                </span>
                            </Link>
                        </div>

                        <ul className="hidden items-center gap-8 md:flex">
                            <li
                                className="relative"
                                ref={dropRef}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    className={`flex items-center gap-1 font-semibold transition-colors ${catDropOpen ? 'text-accent' : 'text-slate-600 hover:text-slate-900'}`}
                                    onClick={() => setCatDropOpen((v) => !v)}
                                >
                                    Categories
                                    <svg
                                        className={`h-4 w-4 transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        ></path>
                                    </svg>
                                </button>
                                <div
                                    className={`absolute top-full -left-4 mt-2 w-screen max-w-md origin-top-left rounded-2xl border border-slate-100 bg-white shadow-xl transition-all duration-200 ${catDropOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}
                                >
                                    <div className="grid grid-cols-3 gap-2 p-4">
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
                                                className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-slate-50"
                                            >
                                                <span
                                                    className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110"
                                                    style={{
                                                        backgroundColor: cat.color,
                                                        color: cat.iconColor,
                                                    }}
                                                >
                                                    <cat.Icon size={20} strokeWidth={2} />
                                                </span>
                                                <span className="w-full truncate text-center text-xs font-bold text-slate-700">
                                                    {cat.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </li>
                            <li>
                                <a
                                    href="#bulk-deals"
                                    className="font-semibold text-slate-600 transition-colors hover:text-slate-900"
                                >
                                    Bulk Deals
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        {}
                        <div ref={searchRef} className="relative hidden sm:block">
                            <div
                                className={`flex items-center rounded-full border bg-slate-100 px-4 py-2 transition-all ${isSearchOpen ? 'border-accent ring-accent/20 bg-white shadow-md ring-2' : 'border-transparent hover:bg-slate-200'}`}
                            >
                                <Search size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products, SKUs, suppliers..."
                                    className="w-48 border-none bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 lg:w-64"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            executeSearch(searchInput);
                                        }
                                    }}
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => {
                                            setSearchInput('');
                                            searchRef.current?.querySelector('input')?.focus();
                                        }}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {}
                            {isSearchOpen && (
                                <div className="animate-in fade-in slide-in-from-top-2 absolute top-full right-0 z-50 mt-3 flex w-[500px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                                    {searchInput.trim().length > 0 ? (
                                        <div className="p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                    Live Results for "{searchInput}"
                                                </p>
                                                {isSearching && (
                                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {liveSearchData?.products?.length > 0
                                                    ? liveSearchData.products.map((prod) => (
                                                          <div
                                                              key={prod._id}
                                                              onClick={() => {
                                                                  setIsSearchOpen(false);
                                                                  navigate(`/product/${prod._id}`);
                                                              }}
                                                              className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-slate-100 hover:bg-slate-50"
                                                          >
                                                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                                                  <img
                                                                      src={
                                                                          prod.images?.[0]?.url ||
                                                                          'https://via.placeholder.com/40'
                                                                      }
                                                                      alt={prod.title}
                                                                      className="h-full w-full object-cover"
                                                                  />
                                                              </div>
                                                              <div className="flex-1 overflow-hidden">
                                                                  <p className="truncate text-sm font-bold text-slate-900">
                                                                      {prod.title}
                                                                  </p>
                                                                  {}
                                                                  <p className="mb-1 font-mono text-xs text-slate-500">
                                                                      SKU: {prod.sku}
                                                                  </p>
                                                                  <p className="text-xs text-slate-500">
                                                                      MOQ: {prod.moq || 10} units •
                                                                      ₹
                                                                      {prod.platformSellPrice?.toLocaleString(
                                                                          'en-IN'
                                                                      ) || 0}
                                                                      /unit
                                                                  </p>
                                                              </div>
                                                          </div>
                                                      ))
                                                    : !isSearching && (
                                                          <div className="py-4 text-center text-sm text-slate-500">
                                                              No direct matches found. Try hitting
                                                              Enter to search all catalogs.
                                                          </div>
                                                      )}
                                            </div>
                                            <button
                                                onClick={() => executeSearch(searchInput)}
                                                className="text-accent hover:text-accent/80 mt-4 w-full rounded-lg bg-slate-50 py-2 text-center text-sm font-bold transition-colors hover:bg-slate-100"
                                            >
                                                View all results ➔
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex bg-slate-50/50">
                                            <div className="w-1/2 border-r border-slate-100 p-4">
                                                <p className="mb-3 flex items-center gap-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                    <Clock size={14} /> Quick Searches
                                                </p>
                                                <ul className="space-y-2">
                                                    {[
                                                        'Wholesale electronics',
                                                        'Corporate gifting sets',
                                                        'Industrial supplies',
                                                    ].map((term) => (
                                                        <li
                                                            key={term}
                                                            onClick={() => executeSearch(term)}
                                                            className="hover:text-accent cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-white"
                                                        >
                                                            {term}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="w-1/2 p-4">
                                                <p className="mb-3 flex items-center gap-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                    <TrendingUp size={14} /> Trending B2B
                                                </p>
                                                <ul className="space-y-2">
                                                    {[
                                                        'Office Laptops Bulk',
                                                        'Industrial Packaging',
                                                        'Bulk T-Shirts',
                                                    ].map((term) => (
                                                        <li
                                                            key={term}
                                                            onClick={() => executeSearch(term)}
                                                            className="hover:text-accent cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-white"
                                                        >
                                                            {term}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsWishlistOpen(true)}
                                className="hover:text-danger hover:bg-danger/10 relative rounded-full p-2 text-slate-600 transition-colors"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill={wishlistItems?.length > 0 ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    ></path>
                                </svg>
                                {wishlistItems?.length > 0 && (
                                    <span className="bg-danger absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    ></path>
                                </svg>
                                {cartItems?.length > 0 && (
                                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white">
                                        {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </button>

                            <div className="ml-2 hidden border-l border-slate-200 pl-4 lg:block">
                                {loading ? (
                                    <div className="border-t-accent h-8 w-8 animate-spin rounded-full border-2 border-slate-200"></div>
                                ) : user ? (
                                    <div className="flex items-center gap-4">
                                        <Link
                                            to="/my-account"
                                            className="hover:text-accent text-sm font-bold text-slate-900"
                                        >
                                            Hi, {user?.name?.split(' ')[0]}
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="text-xs font-bold text-slate-500 hover:text-slate-900"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to="/login"
                                            className="text-sm font-bold text-slate-600 hover:text-slate-900"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isSearchOpen && (
                <div
                    className="fixed inset-0 top-20 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSearchOpen(false)}
                ></div>
            )}

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
        </nav>
    );
}

export default Navbar;
