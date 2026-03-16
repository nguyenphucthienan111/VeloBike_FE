import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/login'
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [unauthRole, setUnauthRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setIsAuthorized(false);
        setUnauthRole(null);
        setIsChecking(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
          setUnauthRole(null);
        } else {
          setIsAuthorized(false);
          setUnauthRole(user.role || null);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        setIsAuthorized(false);
        setUnauthRole(null);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (unauthRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (unauthRole === 'INSPECTOR') return <Navigate to="/inspector/dashboard" replace />;
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
