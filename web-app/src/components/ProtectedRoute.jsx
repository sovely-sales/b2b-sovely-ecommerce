import React, { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return <LoadingScreen />;

    // If no user, redirect to login and save the attempted URL
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Return children (if used as a wrapper) or Outlet (if used as a layout route)
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
