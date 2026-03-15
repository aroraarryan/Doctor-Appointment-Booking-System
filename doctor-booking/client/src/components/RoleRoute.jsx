import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
       const { user, loading } = useAuth();

       if (loading) return <div>Loading...</div>;

       if (!user) return <Navigate to="/login" />;

       return allowedRoles.includes(user.role) ? (
              children
       ) : (
              <Navigate to="/unauthorized" />
       );
};

export default RoleRoute;
