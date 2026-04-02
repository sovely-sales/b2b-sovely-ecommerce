import { Suspense, lazy, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './AuthContext';
import { ROUTES } from './utils/routes';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import ErrorBoundary from './ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

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
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const Careers = lazy(() => import('./components/Careers'));
const Services = lazy(() => import('./components/Services'));
const KycSubmit = lazy(() => import('./components/KycSubmit'));

const NotFound = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-black text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h2>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
    </div>
);

const HomeRouter = () => {
    const { user, loading, isAdmin } = useContext(AuthContext);
    if (loading) return <LoadingScreen />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (user) return <Navigate to={ROUTES.CATALOG} replace />;
    return <MarketingLandingPage />;
};

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const { user, loading } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;

    return children ? children : <Outlet />;
};

const AdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user || !isAdmin) return <Navigate to={ROUTES.CATALOG} replace />;

    return children ? children : <Outlet />;
};

const ResellerRoute = ({ children }) => {
    const { user, loading, isKycApproved } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

    if (user.accountType === 'B2B' && !isKycApproved) {
        return <Navigate to="/kyc" replace />;
    }

    return children ? children : <Outlet />;
};

function App() {
    return (
        <ErrorBoundary>
            <ScrollToTop />
            <Toaster position="bottom-right" />

            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {}
                    <Route element={<PublicLayout />}>
                        <Route path={ROUTES.HOME} element={<HomeRouter />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
                        <Route path={ROUTES.CAREERS} element={<Careers />} />
                        <Route path={ROUTES.SERVICES} element={<Services />} />
                    </Route>

                    {}
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.SIGNUP} element={<Signup />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

                    {}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            {}
                            <Route path={ROUTES.CATALOG} element={<LandingPage />} />
                            <Route path="/category/:categoryName" element={<LandingPage />} />
                            <Route path="/product/:productId" element={<ProductPage />} />
                            <Route path={ROUTES.SEARCH} element={<SearchResults />} />

                            {}
                            <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
                            <Route path={ROUTES.ORDERS} element={<Orders />} />
                            <Route path="/orders/:id/track" element={<OrderTracking />} />
                            <Route path="/kyc" element={<KycSubmit />} />

                            {}
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

                    {}
                    <Route element={<AdminRoute />}>
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>

                    {}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
