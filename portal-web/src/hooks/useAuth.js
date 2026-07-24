// Hook wrapper do AuthContext — re-export + helpers de conveniência

import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const ctx = useAuthContext();
  
  return {
    ...ctx,
    // Helpers de conveniência para templates
    isAdmin: ctx.role === 'admin',
    isInstitution: ctx.role === 'institution',
    displayName: ctx.institution?.name || ctx.user?.sub || 'Utilizador',
    institutionId: ctx.institution?.id || null,
    credits: ctx.institution?.credits || 0,
    plan: ctx.institution?.subscription_plan || 'standard',
    canAccess: (routeRole) => ctx.hasPermission(routeRole),
  };
};

export default useAuth;

