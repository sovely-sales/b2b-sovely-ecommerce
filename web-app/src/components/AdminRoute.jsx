import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';

const AdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useContext(AuthContext);

    if (loading) return <LoadingScreen />;

    // If not logged in, or not an admin, kick them back to the catalog
    if (!user || !isAdmin) {
        return <Navigate to="/catalog" replace />;
    }

    return children ? children : <Outlet />;
};

export default AdminRoute;
