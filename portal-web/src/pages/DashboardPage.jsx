import { useAuth } from '../hooks/useAuth';
import AdminDashboardPage from './AdminDashboardPage';
import InstitutionDashboardPage from './InstitutionDashboardPage';

const DashboardPage = () => {
  const { isAdmin, isInstitution } = useAuth();

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  if (isInstitution) {
    return <InstitutionDashboardPage />;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500 text-sm">Acesso não autorizado</p>
    </div>
  );
};

export default DashboardPage;

