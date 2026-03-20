import { Suspense, lazy, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ROUTES } from './utils/routes'; // <-- NEW: Imported Routes
import LoadingScreen from './components/LoadingScreen';
import AdminRoute from './components/AdminRoute';
import ResellerRoute from './components/ResellerRoute';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './ErrorBoundary';

// Lazy loaded components
const LandingPage = lazy(() => import('./components/LandingPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const MyAccount = lazy(() => import('./components/MyAccount'));
const AccountSettings = lazy(() => import('./components/AccountSettings')); // <-- NEW: Fix for Flaw #1
const Invoices = lazy(() => import('./components/Invoices'));
const QuickOrder = lazy(() => import('./components/QuickOrder'));
const Checkout = lazy(() => import('./components/Checkout'));
const Orders = lazy(() => import('./components/Orders'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const Wallet = lazy(() => import('./components/Wallet'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SearchResults = lazy(() => import('./components/SearchResults'));

// Simple 404 Component
const NotFound = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-black text-slate-200">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h2>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const { user, loading } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    <Route element={<MainLayout />}>
                        {/* --- PUBLIC ROUTES --- */}
                        <Route path={ROUTES.HOME} element={<LandingPage />} />
                        <Route path="/product/:productId" element={<ProductPage />} />
                        <Route path={ROUTES.SEARCH} element={<SearchResults />} />

                        {/* --- PROTECTED (GENERAL USER) ROUTES --- */}
                        <Route path={ROUTES.CHECKOUT} element={
                            <ProtectedRoute><Checkout /></ProtectedRoute>
                        } />
                        <Route path={ROUTES.ORDERS} element={
                            <ProtectedRoute><Orders /></ProtectedRoute>
                        } />
                        <Route path="/orders/:id/track" element={
                            <ProtectedRoute><OrderTracking /></ProtectedRoute>
                        } />
                        <Route path={ROUTES.WALLET} element={
                            <ProtectedRoute><Wallet /></ProtectedRoute>
                        } />

                        {/* --- RESELLER ONLY HUB --- */}
                        <Route element={<ResellerRoute />}>
                            <Route path={ROUTES.MY_ACCOUNT} element={<MyAccount />} />
                            <Route path={ROUTES.ACCOUNT_SETTINGS} element={<AccountSettings />} /> {/* Fix for Flaw #1 */}
                            <Route path={ROUTES.INVOICES} element={<Invoices />} />
                            <Route path={ROUTES.QUICK_ORDER} element={<QuickOrder />} />
                        </Route>
                        
                        {/* --- 404 CATCH ALL --- */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* --- AUTH ROUTES --- */}
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.SIGNUP} element={<Signup />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

                    {/* --- ADMIN ROUTING --- */}
                    <Route path="/admin/*" element={
                        <AdminRoute><AdminDashboard /></AdminRoute>
                    } />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;