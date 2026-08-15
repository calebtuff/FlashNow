import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-t16 text-center" aria-busy="true">
        {/* A warming instrument: the scale is lit before any reading lands. */}
        <div className="scale-rule mx-auto w-32 animate-pulse" aria-hidden />
        <p className="legend mt-t3 text-tick text-lume-faint">Connecting</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}
