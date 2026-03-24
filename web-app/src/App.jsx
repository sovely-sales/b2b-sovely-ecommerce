import { Suspense, lazy, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './AuthContext';
import { ROUTES } from './utils/routes';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import ErrorBoundary from './ErrorBoundary';

// Lazy loaded components
const MarketingLandingPage = lazy(() => import('./components/MarketingLandingPage'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const MyAccount = lazy(() => import('./components/MyAccount'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const Invoices = lazy(() => import('./components/Invoices'));
const QuickOrder = lazy(() => import('./components/QuickOrder'));
const Checkout = lazy(() => import('./components/Checkout'));
const Orders = lazy(() => import('./components/Orders'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const Wallet = lazy(() => import('./components/Wallet'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const Terms = lazy(() => import('./components/Terms'));
const KycSubmit = lazy(() => import('./components/KycSubmit'));

// 404 Component
const NotFound = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-black text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h2>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
    </div>
);

// --- ROUTE GUARDS (The Bouncers) ---

// 1. Traffic Cop for the Root URL
const HomeRouter = () => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to={ROUTES.CATALOG} replace />;
    return <MarketingLandingPage />;
};

// 2. Protects the B2B Portal from Guests
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const { user, loading } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;

    // THE FIX: Return Outlet if used as a wrapper!
    return children ? children : <Outlet />;
};

// 3. Protects Admin Dashboard
const AdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user || !isAdmin) return <Navigate to={ROUTES.CATALOG} replace />;

    return children ? children : <Outlet />;
};

// 4. Protects Sensitive Reseller Pages (Wallet, Quick Order)
const ResellerRoute = ({ children }) => {
    const { user, loading, isKycApproved } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

    // Lock B2B users out of these pages if KYC is pending
    if (user.accountType === 'B2B' && !isKycApproved) {
        return <Navigate to="/kyc" replace />;
    }

    return children ? children : <Outlet />;
};

function App() {
    return (
        <ErrorBoundary>
            <Toaster position="bottom-right" />

            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* --- 1. PUBLIC MARKETING (Unprotected) --- */}
                    <Route element={<PublicLayout />}>
                        <Route path={ROUTES.HOME} element={<HomeRouter />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Terms />} />
                    </Route>

                    {/* --- 2. AUTHENTICATION (Unprotected) --- */}
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.SIGNUP} element={<Signup />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

                    {/* --- 3. B2B PORTAL (Protected - Login Required) --- */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            {/* Core Catalog */}
                            <Route path={ROUTES.CATALOG} element={<LandingPage />} />
                            <Route path="/product/:productId" element={<ProductPage />} />
                            <Route path={ROUTES.SEARCH} element={<SearchResults />} />

                            {/* Standard User Actions */}
                            <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
                            <Route path={ROUTES.ORDERS} element={<Orders />} />
                            <Route path="/orders/:id/track" element={<OrderTracking />} />
                            <Route path="/kyc" element={<KycSubmit />} />

                            {/* --- 4. SENSITIVE B2B DATA (KYC/Reseller Required) --- */}
                            <Route element={<ResellerRoute />}>
                                <Route path={ROUTES.MY_ACCOUNT} element={<MyAccount />} />
                                <Route
                                    path={ROUTES.ACCOUNT_SETTINGS}
                                    element={<AccountSettings />}
                                />
                                <Route path={ROUTES.INVOICES} element={<Invoices />} />
                                <Route path={ROUTES.QUICK_ORDER} element={<QuickOrder />} />
                                <Route path={ROUTES.WALLET} element={<Wallet />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* --- 5. PLATFORM ADMIN (Admin Only) --- */}
                    <Route element={<AdminRoute />}>
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>

                    {/* --- CATCH ALL --- */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
