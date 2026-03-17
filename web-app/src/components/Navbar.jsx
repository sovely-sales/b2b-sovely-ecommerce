import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CartContext } from '../CartContext';
import { WishlistContext } from '../WishlistContext';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi';
import { getCategoryIcon } from '../utils/categoryIcons';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import { Search, X, Clock, TrendingUp } from 'lucide-react'; 

function Navbar({ onToggleSidebar, onSelectCategory }) {
  const { user, logout, loading } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { wishlistItems } = useContext(WishlistContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const dropRef = useRef(null);
  const hoverTimeout = useRef(null);
  const navigate = useNavigate();

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productApi.getCategories
  });

  const displayCategories = dbCategories.map((cat) => {
    const visual = getCategoryIcon(cat.name);
    return { _id: cat._id, name: cat.name, Icon: visual.Icon, color: visual.color, iconColor: visual.iconColor };
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

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

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

            <ul className="hidden md:flex items-center gap-8">
              <li className="relative" ref={dropRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <button 
                  className={`flex items-center gap-1 font-semibold transition-colors ${catDropOpen ? 'text-accent' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setCatDropOpen((v) => !v)}
                >
                  Categories
                  <svg className={`w-4 h-4 transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

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
              <li><a href="#bulk-deals" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">Bulk Deals</a></li>
            </ul>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">

            {}
            <div ref={searchRef} className="hidden sm:block relative">
              <div className={`flex items-center bg-slate-100 border transition-all rounded-full px-4 py-2 ${isSearchOpen ? 'border-accent bg-white shadow-md ring-2 ring-accent/20' : 'border-transparent hover:bg-slate-200'}`}>
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, SKUs, suppliers..."
                  className="bg-transparent border-none outline-none text-sm font-medium w-48 lg:w-64 px-3 text-slate-900 placeholder:text-slate-400"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>

              {}
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
                  {searchInput ? (
                    <div className="p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Results for "{searchInput}"</p>
                      {}
                      <div className="space-y-2">
                        <div className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-slate-100">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Sample B2B Product ({searchInput})</p>
                            <p className="text-xs text-slate-500">MOQ: 50 units • ₹450/unit</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setIsSearchOpen(false)} className="w-full mt-4 text-center text-sm font-bold text-accent hover:text-accent/80">View all results ➔</button>
                    </div>
                  ) : (
                    <div className="flex bg-slate-50/50">
                      <div className="w-1/2 p-4 border-r border-slate-100">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Clock size={14}/> Recent</p>
                         <ul className="space-y-2">
                            <li className="text-sm text-slate-600 hover:text-accent cursor-pointer font-medium">Wholesale electronics</li>
                            <li className="text-sm text-slate-600 hover:text-accent cursor-pointer font-medium">Corporate gifting sets</li>
                         </ul>
                      </div>
                      <div className="w-1/2 p-4">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1"><TrendingUp size={14}/> Trending B2B</p>
                         <ul className="space-y-2">
                            <li className="text-sm text-slate-600 hover:text-accent cursor-pointer font-medium">Office Laptops Bulk</li>
                            <li className="text-sm text-slate-600 hover:text-accent cursor-pointer font-medium">Industrial Packaging</li>
                         </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {}
              <button onClick={() => setIsWishlistOpen(true)} className="relative p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-full transition-colors">
                <svg className="w-6 h-6" fill={wishlistItems?.length > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                {wishlistItems?.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{wishlistItems.length}</span>}
              </button>

              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                {cartItems?.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>}
              </button>

              {}
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

            </div>
          </div>
        </div>
      </div>

      {}
      {isSearchOpen && (
        <div className="fixed inset-0 top-20 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSearchOpen(false)}></div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </nav>
  );
}

export default Navbar;