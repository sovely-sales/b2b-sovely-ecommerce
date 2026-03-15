import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import AdminRoute from './components/AdminRoute';

// Lazy load routes to actually utilize Suspense
const LandingPage = lazy(() => import('./components/LandingPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const MyAccount = lazy(() => import('./components/MyAccount'));
const Checkout = lazy(() => import('./components/Checkout'));
const Orders = lazy(() => import('./components/Orders'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SearchResults = lazy(() => import('./components/SearchResults'));

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id/track" element={<OrderTracking />} />
            <Route path="/search" element={<SearchResults />} />
            <Route 
                path="/admin" 
                element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                } 
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
