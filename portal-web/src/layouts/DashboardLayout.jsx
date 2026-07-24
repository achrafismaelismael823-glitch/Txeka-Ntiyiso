// Layout Enterprise — Sidebar collapsible, Navbar com dados da instituição, responsivo, glassmorphism

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  Files,
  Search,
  ShieldCheck,
  Building2,
  Coins,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  CreditCard,
  Crown,
  UserCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'institution'] },
  { path: '/emit', label: 'Emitir Documento', icon: FilePlus, roles: ['institution'] },
  { path: '/bulk', label: 'Emissão em Lote', icon: Files, roles: ['institution'] },
  { path: '/verify', label: 'Verificação', icon: Search, roles: ['any'] },
  { path: '/documents', label: 'Documentos', icon: ShieldCheck, roles: ['admin', 'institution'] },
  { path: '/audit', label: 'Auditoria', icon: Clock, roles: ['admin'] },
  { path: '/institutions', label: 'Instituições', icon: Building2, roles: ['admin'] },
  { path: '/credits', label: 'Créditos', icon: Coins, roles: ['admin', 'institution'] },
  { path: '/settings', label: 'Configurações', icon: Settings, roles: ['admin', 'institution'] },
];

export default function DashboardLayout() {
  const { user, institution, role, logout, sessionWarning, extendSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Detect scroll para glassmorphism na navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fechar mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const filteredMenu = menuItems.filter((item) => {
    if (item.roles.includes('any')) return true;
    return item.roles.includes(role);
  });

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  const planColors = {
    standard: 'bg-slate-100 text-slate-700',
    premium: 'bg-amber-100 text-amber-700',
    enterprise: 'bg-violet-100 text-violet-700',
  };

  const planLabel = institution?.subscription_plan || 'standard';
  const planBadgeClass = planColors[planLabel] || planColors.standard;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-['Plus_Jakarta_Sans']">
      
      {/* ─── SIDEBAR DESKTOP ─────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col fixed h-screen bg-[#0B192C] text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center ${sidebarOpen ? 'px-6' : 'justify-center'} border-b border-white/10`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00D2C4] rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#0B192C]" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">Txeka Ntiyiso</h1>
                <p className="text-[10px] text-white/50">Enterprise Portal</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#00D2C4] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#0B192C]" />
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#00D2C4] rounded-full flex items-center justify-center text-[#0B192C] shadow-lg hover:scale-110 transition"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#00D2C4] text-[#0B192C] font-semibold shadow-lg shadow-[#00D2C4]/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#0B192C]' : 'text-white/50 group-hover:text-white'}`} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
                {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-[#0B192C] rounded-full" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User mini profile */}
        <div className={`border-t border-white/10 p-4 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-white/70" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">{institution?.name || user?.sub || 'Utilizador'}</p>
                  <p className="text-xs text-white/40 capitalize">{role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/20 transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Terminar Sessão
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/20 transition" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* ─── SIDEBAR MOBILE ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[#0B192C] h-full flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00D2C4] rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#0B192C]" />
                </div>
                <h1 className="font-bold text-sm">Txeka Ntiyiso</h1>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {filteredMenu.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      isActive
                        ? 'bg-[#00D2C4] text-[#0B192C] font-semibold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="border-t border-white/10 p-4">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/20 transition text-sm">
                <LogOut className="w-4 h-4" /> Terminar Sessão
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        
        {/* Navbar */}
        <header
          className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 ${
            scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50' : 'bg-transparent'
          }`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-[#0B192C]">
                {filteredMenu.find((m) => m.path === location.pathname)?.label || 'Txeka Ntiyiso'}
              </h2>
              <p className="text-xs text-slate-400">Portal de Verificação Documental</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Créditos */}
            {institution && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                <CreditCard className="w-4 h-4 text-[#00D2C4]" />
                <span className="text-sm font-semibold text-[#0B192C]">{institution.credits || 0}</span>
                <span className="text-xs text-slate-400">créditos</span>
              </div>
            )}

            {/* Plano */}
            {institution && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${planBadgeClass}`}>
                <Crown className="w-3 h-3" />
                {planLabel.charAt(0).toUpperCase() + planLabel.slice(1)}
              </div>
            )}

            {/* Notificações */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 bg-[#0B192C] rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:ring-2 ring-[#00D2C4] transition">
              {(institution?.name?.[0] || user?.sub?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Session Warning Banner */}
        {sessionWarning && (
          <div className="mx-4 lg:mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Sessão prestes a expirar</p>
              <p className="text-xs text-amber-600">A sua sessão será terminada em breve por inatividade.</p>
            </div>
            <button
              onClick={extendSession}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition"
            >
              Continuar Sessão
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

