import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, FilePlus, Files, Users, 
  Settings, LogOut, Menu, X, CreditCard, 
  Activity, ClipboardList, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ============================================
// ITENS DE NAVEGAÇÃO
// ============================================

const navItems = [
  { path: '/', label: 'Painel', icon: LayoutDashboard, scope: 'all' },
  { path: '/emit', label: 'Emitir Documento', icon: FilePlus, scope: 'all' },
  { path: '/bulk-emit', label: 'Emissão em Massa', icon: Files, scope: 'all' },
  { path: '/verify', label: 'Verificar', icon: FileCheck, scope: 'all' },
  { path: '/documents', label: 'Documentos', icon: ClipboardList, scope: 'all' },
  { path: '/credits', label: 'Créditos', icon: CreditCard, scope: 'all' },
  { path: '/settings', label: 'Configurações', icon: Settings, scope: 'all' },
  
  // ─── ADMIN ONLY ───
  { path: '/audit', label: 'Auditoria', icon: Activity, scope: 'admin' },
  { path: '/institutions', label: 'Instituições', icon: Users, scope: 'admin' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filtra menu conforme perfil
  const filteredNav = navItems.filter((item) => {
    if (item.scope === 'admin') return isAdmin;
    return true; // 'all' — visto por todos
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dados do utilizador para exibição
  const displayName = user?.name || user?.institution_name || user?.id || 'Utilizador';
  const displayRole = isAdmin 
    ? 'Administrador do Sistema' 
    : (user?.role || 'Instituição Certificada');
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-brand-fundo-escuro relative">
      
      {/* Malha cibernética sutil no fundo */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.35) 1px, transparent 1px)`,
          backgroundSize: '5rem 5rem'
        }}
      />

      {/* Overlay mobile quando sidebar aberta */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
          bg-[#0a1929]/95 backdrop-blur-xl border-r border-white/[0.03] 
          transform transition-transform duration-300 ease-out
          lg:transform-none flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header da Sidebar */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.03]">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-black/30 ring-1 ring-white/[0.06]">
            <img 
              src="/images/txeka-icon.png" 
              alt="Txeka Ntiyiso" 
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-[#f8fafc] leading-none tracking-tight truncate">
              Txeka
            </h1>
            <p className="text-[0.6rem] text-[#2dd4bf] tracking-[0.15em] uppercase font-medium leading-none mt-1">
              Ntiyiso
            </p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-silver-dark" />
          </button>
        </div>

        {/* Badge Admin (só aparece para admin) */}
        {isAdmin && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[0.65rem] font-bold text-purple-400 uppercase tracking-wider">
                Modo Administrador
              </span>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive 
                    ? 'text-[#22d3ee] bg-[#06b6d4]/8 border-r-2 border-[#06b6d4]' 
                    : 'text-[#94a3b8] hover:text-[#22d3ee] hover:bg-[#06b6d4]/4'
                  }
                `}
              >
                <Icon className={`
                  w-[1.1rem] h-[1.1rem] transition-colors duration-200
                  ${isActive ? 'text-[#06b6d4]' : 'text-[#64748b] group-hover:text-[#22d3ee]'}
                `} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-[#06b6d4]" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil do Utilizador + Logout */}
        <div className="p-4 border-t border-white/[0.03] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="w-9 h-9 rounded-full bg-[#06b6d4]/10 flex items-center justify-center border border-[#06b6d4]/20 shrink-0">
              <span className="text-sm font-bold text-[#22d3ee]">{userInitial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f8fafc] truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[0.6rem] text-silver-dark uppercase tracking-wide truncate">
                {displayRole}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200"
          >
            <LogOut className="w-[1.1rem] h-[1.1rem]" />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Header Mobile */}
        <header className="sticky top-0 z-30 bg-[#080f1a]/80 backdrop-blur-md border-b border-white/[0.03] px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5 text-[#94a3b8]" />
          </button>
          
          {/* Breadcrumb / Título da página */}
          <div className="hidden lg:flex items-center gap-2 text-[0.7rem] text-silver-dark/50 uppercase tracking-wider">
            <span>Txeka Ntiyiso</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#22d3ee]/70">{location.pathname === '/' ? 'Painel' : filteredNav.find(n => n.path === location.pathname)?.label || 'Página'}</span>
          </div>

          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            {/* Indicador de sistema */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[0.7rem] text-silver-dark/70">Sistema Online</span>
            </div>
            
            {/* Indicador de ambiente Admin */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/20">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span className="text-[0.7rem] text-purple-400 font-medium">Admin</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer Institucional */}
        <footer className="px-6 lg:px-8 py-4 border-t border-white/[0.03] bg-[#080f1a]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5">
              <img 
                src="/images/txeka-icon.png" 
                alt="" 
                className="w-4 h-4 opacity-30 grayscale" 
                draggable={false} 
              />
              <p className="text-[0.6rem] text-silver-dark/25 tracking-wide text-center sm:text-left leading-relaxed">
                Txeka Ntiyiso — Infraestrutura Tecnológica de Verificação da Integridade e Autenticidade Documental
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.6rem] text-silver-dark/20 tracking-wider">v2.0.0</span>
              <span className="w-1 h-1 rounded-full bg-silver-dark/15" />
              <span className="text-[0.6rem] text-silver-dark/20 tracking-wider">ISO 27001</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

