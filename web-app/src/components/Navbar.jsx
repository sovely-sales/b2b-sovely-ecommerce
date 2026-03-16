import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CartContext } from '../CartContext';
import { WishlistContext } from '../WishlistContext';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi';
import { getCategoryIcon } from '../utils/categoryIcons';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';

function Navbar({ onToggleSidebar, onSelectCategory }) {
  const { user, logout, loading } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { wishlistItems } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const dropRef = useRef(null);
  const hoverTimeout = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productApi.getCategories
  });

  const displayCategories = dbCategories.map((cat) => {
    const visual = getCategoryIcon(cat.name);
    return {
      _id: cat._id, name: cat.name, Icon: visual.Icon, color: visual.color, iconColor: visual.iconColor
    };
  });

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout.current);
    setCatDropOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setCatDropOpen(false), 180);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left Side: Logo & Links */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <button onClick={onToggleSidebar} className="text-slate-600 hover:text-slate-900 transition-colors p-1" aria-label="Menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <Link to="/" className="flex items-center gap-2 group">
                <img src="https://m.media-amazon.com/images/X/bxt1/M/Bbxt1BI1cNpD5ln._SL160_QL95_FMwebp_.png" alt="Sovely Logo" className="h-8 w-auto group-hover:scale-105 transition-transform" />
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">Sovely</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-8">
              <li className="relative" ref={dropRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <button 
                  className={`flex items-center gap-1 font-semibold transition-colors ${catDropOpen ? 'text-accent' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setCatDropOpen((v) => !v)}
                >
                  Categories
                  <svg className={`w-4 h-4 transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Dropdown Menu */}
                <div className={`absolute top-full -left-4 mt-2 w-screen max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 transition-all duration-200 origin-top-left ${catDropOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {displayCategories.map((cat, i) => (
                      <button
                        key={cat._id || i}
                        onClick={() => { setCatDropOpen(false); if (onSelectCategory) onSelectCategory(cat.name); }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <span className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style={{ backgroundColor: cat.color, color: cat.iconColor }}>
                          <cat.Icon size={20} strokeWidth={2} />
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </li>
              <li><a href="#deals" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">Deals</a></li>
              <li><a href="#new" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">What's New</a></li>
            </ul>
          </div>

          {/* Right Side: Search & Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Search Bar (Hidden on very small screens) */}
            <div className="hidden sm:flex items-center bg-slate-100/80 hover:bg-slate-100 border border-transparent focus-within:border-accent/30 focus-within:bg-white rounded-full px-4 py-2 transition-all">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm font-medium w-32 lg:w-48 px-2 text-slate-900 placeholder:text-slate-400"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsWishlistOpen(true)} className="relative p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-full transition-colors">
                <svg className="w-6 h-6" fill={wishlistItems?.length > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                {wishlistItems?.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{wishlistItems.length}</span>}
              </button>

              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                {cartItems?.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>}
              </button>

              {/* Auth Status */}
              <div className="hidden lg:block ml-2 pl-4 border-l border-slate-200">
                {loading ? (
                   <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent animate-spin"></div>
                ) : user ? (
                  <div className="flex items-center gap-4">
                    <Link to="/my-account" className="font-bold text-sm text-slate-900 hover:text-accent">Hi, {user?.name?.split(' ')[0]}</Link>
                    <button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-slate-900">Logout</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900">Log in</Link>
                    <Link to="/signup" className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors">Sign Up</Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full">
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 pb-6 space-y-4">
            <div className="px-2 pb-4">
               <input type="text" placeholder="Search..." className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none text-slate-900" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearch} />
            </div>
            <a href="#deals" className="block px-4 py-2 text-lg font-bold text-slate-900">Deals</a>
            <a href="#new" className="block px-4 py-2 text-lg font-bold text-slate-900">What's New</a>
            {!user && (
               <div className="flex flex-col gap-2 pt-4 px-4 border-t border-slate-100">
                  <Link to="/login" className="w-full py-3 text-center font-bold text-slate-900 border border-slate-200 rounded-xl">Log In</Link>
                  <Link to="/signup" className="w-full py-3 text-center font-bold text-white bg-slate-900 rounded-xl">Sign Up</Link>
               </div>
            )}
          </div>
        )}
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </nav>
  );
}

export default Navbar;