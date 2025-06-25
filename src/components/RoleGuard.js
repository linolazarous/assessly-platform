// src/components/RoleGuard.js
const RoleGuard = ({ orgId, role, children }) => {
  const { claims } = useAuth();
  const hasRole = claims?.[`org_${orgId}_role`] === role;
  
  return hasRole ? children : <Navigate to="/unauthorized" />;
};