import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, FilePlus, Files, Users, 
  Settings, LogOut, Menu, X, CreditCard, 
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
    <div className="min-h-screen flex bg-brand-fundo-escuro relative">
      
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.35) 1px, transparent 1px)`,
          backgroundSize: '5rem 5rem'
        }}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0a1929]/95 backdrop-blur-xl border-r border-white/[0.03] transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.03]">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-black/30">
              <img 
                src="/images/txeka-icon.png" 
                alt="Txeka Ntiyiso" 
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#f8fafc] leading-none tracking-tight">Txeka</h1>
              <p className="text-[0.6rem] text-[#2dd4bf] tracking-[0.15em] uppercase font-medium leading-none mt-1">Ntiyiso</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 rounded-lg hover:bg-white/5">
              <X className="w-5 h-5 text-silver-dark" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
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
                  <Icon className="w-[1.1rem] h-[1.1rem]" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#06b6d4]" />}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/[0.03]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-white/[0.02]">
              <div className="w-8 h-8 rounded-full bg-[#06b6d4]/10 flex items-center justify-center border border-[#06b6d4]/20">
                <span className="text-xs font-bold text-[#22d3ee]">{(user?.name || user?.id || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#f8fafc] truncate">{user?.name || user?.id}</p>
                <p className="text-[10px] text-silver-dark uppercase tracking-wide">{user?.role || 'Instituição'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-[1.1rem] h-[1.1rem]" />
              <span className="text-sm font-medium">Terminar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-30 bg-[#080f1a]/80 backdrop-blur-md border-b border-white/[0.03] px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Menu className="w-5 h-5 text-silver" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
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

        <footer className="px-8 py-4 border-t border-white/[0.03]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <img src="/images/txeka-icon.png" alt="" className="w-4 h-4 opacity-40" draggable={false} />
              <p className="text-[0.6rem] text-silver-dark/30 tracking-wide text-center sm:text-left">
                Txeka Ntiyiso — Infraestrutura Tecnológica de Verificação da Integridade e Autenticidade Documental
              </p>
            </div>
            <p className="text-[0.6rem] text-silver-dark/20 tracking-wider">v2.0.0</p>
          </div>
        </footer>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

