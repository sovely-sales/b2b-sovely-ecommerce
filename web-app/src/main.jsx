import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { WishlistProvider } from './WishlistContext.jsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AuthProvider>
                        <WishlistProvider>
                            <App />
                        </WishlistProvider>
                    </AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    </StrictMode>
);




if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .getRegistrations()
        .then(function (registrations) {
            for (let registration of registrations) {
                registration.unregister();
                console.log('💀 Zombie Service Worker Killed successfully!');
                
                setTimeout(() => window.location.reload(), 500);
            }
        })
        .catch((err) => {
            console.error('Failed to unregister service worker:', err);
        });
}
