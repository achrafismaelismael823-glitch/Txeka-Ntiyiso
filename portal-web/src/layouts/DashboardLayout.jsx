import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // ← CORRIGIDO: era ../../hooks/useAuth
import {
  LayoutDashboard, FileText, FileCheck, FileStack, ShieldCheck,
  Activity, CreditCard, Settings, Building2, LogOut, Menu, X,
  ChevronRight, User
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, isAdmin, isInstitution, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'institution'] },
    { path: '/emit', label: 'Emitir Documento', icon: FileCheck, roles: ['admin', 'institution'] },
    { path: '/documents', label: 'Documentos', icon: FileText, roles: ['admin', 'institution'] },
    { path: '/bulk-emit', label: 'Emissão Massiva', icon: FileStack, roles: ['institution'] },
    { path: '/verify', label: 'Verificar', icon: ShieldCheck, roles: ['admin', 'institution'], external: true },
    { path: '/audit', label: 'Auditoria', icon: Activity, roles: ['admin', 'institution'] },
    { path: '/credits', label: 'Créditos', icon: CreditCard, roles: ['institution'] },
    { path: '/institutions', label: 'Instituições', icon: Building2, roles: ['admin'] },
    { path: '/settings', label: 'Configurações', icon: Settings, roles: ['admin', 'institution'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(user?.role));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNav = (item) => {
    if (item.external) {
      window.open('/verify', '_blank');
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.05] bg-slate-900/50 backdrop-blur-xl fixed h-full z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Txeka Ntiyiso</h1>
            <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider">Certificação Blockchain</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive(item.path)
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || user?.id || 'Utilizador'}</p>
              <p className="text-[0.6rem] text-slate-500 uppercase truncate">
                {isAdmin ? 'Administrador' : user?.id}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.05] z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold">Txeka Ntiyiso</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-400">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl pt-16 px-4 pb-4 overflow-y-auto">
          <nav className="space-y-1">
            {visibleItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                  isActive(item.path)
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:bg-white/[0.03]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-white/[0.05]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Terminar Sessão
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="lg:hidden h-16" />
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

