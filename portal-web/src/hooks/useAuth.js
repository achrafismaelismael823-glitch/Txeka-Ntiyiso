import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
export { authService } from '../services/authService';

// Hook unificado — consome AuthContext para estado partilhado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

export default useAuth;
