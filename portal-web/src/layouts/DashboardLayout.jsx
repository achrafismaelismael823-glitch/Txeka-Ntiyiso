import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, FilePlus, Files, Users, 
  Settings, LogOut, Menu, X, Shield, CreditCard, 
  Activity, ClipboardList, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ToastContainer, useToast } from '../components/ui/Toast';

const navItems = [
  { path: '/', label: 'Painel', icon: LayoutDashboard },
  { path: '/emit', label: 'Emitir Documento', icon: FilePlus },
  { path: '/bulk-emit', label: 'Emissão em Massa', icon: Files },
  { path: '/verify', label: 'Verificar', icon: FileCheck },
  { path: '/documents', label: 'Documentos', icon: ClipboardList },
  { path: '/credits', label: 'Créditos', icon: CreditCard },
  { path: '/audit', label: 'Auditoria', icon: Activity, adminOnly: true },
  { path: '/institutions', label: 'Instituições', icon: Users, adminOnly: true },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast('Sessão terminada com sucesso', 'info');
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-tn-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-tn-800/95 backdrop-blur-xl border-r border-tn-500/20 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-tn-500/20">
            <div className="w-9 h-9 rounded-lg bg-cyan/15 flex items-center justify-center border border-cyan/30">
              <Shield className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-silver-light leading-tight">Txeka Ntiyiso</h1>
              <p className="text-[10px] text-cyan-dark tracking-wider uppercase">Validação Digital</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 rounded-lg hover:bg-tn-700/50">
              <X className="w-5 h-5 text-silver-dark" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-cyan" />}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-tn-500/20">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-tn-700/30">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center border border-cyan/30">
                <span className="text-xs font-bold text-cyan">{(user?.name || user?.id || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-silver truncate">{user?.name || user?.id}</p>
                <p className="text-[10px] text-silver-dark uppercase tracking-wide">{user?.role || 'Instituição'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Terminar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-tn-900/80 backdrop-blur-md border-b border-tn-500/20 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-tn-800 transition-colors">
            <Menu className="w-5 h-5 text-silver" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-tn-800/80 border border-tn-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-silver-dark">Sistema Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto page-transition">
            <Outlet context={{ addToast }} />
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

