import React, { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return <LoadingScreen />;

    
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
