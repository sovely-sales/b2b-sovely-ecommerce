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
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));

const AboutUs = lazy(() => import('./components/AboutUs'));
const Services = lazy(() => import('./components/Services'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const FAQ = lazy(() => import('./components/FAQ'));
const Shipping = lazy(() => import('./components/Shipping'));
const Returns = lazy(() => import('./components/Returns'));
const ContactUs = lazy(() => import('./components/ContactUs'));
const BecomeSeller = lazy(() => import('./components/BecomeSeller'));
const Terms = lazy(() => import('./components/Terms'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

const LandingPage = lazy(() => import('./components/LandingPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const OrderCenter = lazy(() => import('./components/OrderCenter'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const AccountHub = lazy(() => import('./components/AccountHub'));
const Wallet = lazy(() => import('./components/tabs/WalletTab'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const NotFound = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center font-sans">
        <h1 className="text-6xl font-black text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h2>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist.</p>
    </div>
);

const HomeRouter = () => {
    const { user, loading, isAdmin } = useContext(AuthContext);
    if (loading) return <LoadingScreen />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (user) return <Navigate to={ROUTES.MY_ACCOUNT} replace />;

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
                        <Route path={ROUTES.ABOUT} element={<AboutUs />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
                        <Route path={ROUTES.SERVICES} element={<Services />} />
                        <Route path={ROUTES.HELP_CENTER} element={<HelpCenter />} />
                        <Route path={ROUTES.SHIPPING} element={<Shipping />} />
                        <Route path={ROUTES.RETURNS} element={<Returns />} />
                        <Route path={ROUTES.CONTACT_US} element={<ContactUs />} />
                        <Route path={ROUTES.BECOME_SELLER} element={<BecomeSeller />} />
                        <Route path="/faq" element={<FAQ />} />
                    </Route>

                    {}
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

                    {}
                    <Route element={<MainLayout />}>
                        <Route path={ROUTES.CATALOG} element={<LandingPage />} />
                        <Route path="/category/:categoryName" element={<LandingPage />} />
                        <Route path="/product/:productId" element={<ProductPage />} />
                        <Route path={ROUTES.SEARCH} element={<SearchResults />} />
                    </Route>

                    {}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            {}
                            <Route path={ROUTES.ORDERS} element={<OrderCenter />} />
                            <Route path="/orders/:id/track" element={<OrderTracking />} />

                            {}
                            <Route path={ROUTES.MY_ACCOUNT} element={<AccountHub />} />

                            {}
                            <Route path={ROUTES.WALLET} element={<Wallet />} />

                            {}
                            <Route
                                path={ROUTES.CHECKOUT}
                                element={<Navigate to={`${ROUTES.ORDERS}?tab=CART`} replace />}
                            />
                            <Route
                                path={ROUTES.QUICK_ORDER}
                                element={
                                    <Navigate to={`${ROUTES.ORDERS}?tab=QUICK_ORDER`} replace />
                                }
                            />
                            <Route
                                path={ROUTES.INVOICES}
                                element={<Navigate to={`${ROUTES.ORDERS}?tab=INVOICES`} replace />}
                            />
                            <Route
                                path={ROUTES.ACCOUNT_SETTINGS}
                                element={<Navigate to={ROUTES.MY_ACCOUNT} replace />}
                            />
                        </Route>
                    </Route>

                    {}
                    <Route element={<AdminRoute />}>
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
