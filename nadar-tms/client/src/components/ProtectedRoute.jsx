import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DEFAULT_ROUTES = {
  admin: '/admin',
  executive: '/admin',
  institution: '/admin',
  incharge: '/incharge',
  driver: '/driver',
  parent: '/parent',
};

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = (user?.role || '').toLowerCase().trim();
  if (roles) {
    const allowed = roles.map((r) => String(r).toLowerCase().trim());
    if (!allowed.includes(userRole)) {
      const target = ROLE_DEFAULT_ROUTES[userRole] || '/login';
      return <Navigate to={target} replace />;
    }
  }
  return children;
}
