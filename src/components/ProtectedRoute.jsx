import { Navigate, Outlet } from 'react-router';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}