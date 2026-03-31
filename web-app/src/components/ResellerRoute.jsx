import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ROUTES } from '../utils/routes';

const ResellerRoute = () => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    
    if (loading) return null;

    
    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    const hasAccess = user.role === 'ADMIN' || user.role === 'RESELLER' || user.role === 'CUSTOMER';

    if (!hasAccess) {
        
        return <Navigate to={ROUTES.HOME} replace />;
    }

    
    return <Outlet />;
};

export default ResellerRoute;
