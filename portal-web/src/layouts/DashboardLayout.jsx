import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { LayoutDashboard, FileText, FileCheck, FileStack, ShieldCheck, Activity, CreditCard, Settings, Building2, LogOut, Menu, X, ChevronRight, User, Search, Keyboard, Zap } from 'lucide-react';

const DashboardLayout = () => {
  const { user, isAdmin, isInstitution, logout } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Menus separados por role — princípio de menor privilégio.
   * Instituição: operacional. Admin: gestão. Nunca misturar.
   */
  const institutionMenu = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
    { path: '/emit', label: 'Emitir Documento', icon: FileCheck, shortcut: '2' },
    { path: '/documents', label: 'Documentos', icon: FileText, shortcut: '3' },
    { path: '/bulk-emit', label: 'Emissão Massiva', icon: FileStack, shortcut: '4' },
    { path: '/verify', label: 'Verificar', icon: ShieldCheck, external: true, shortcut: '5' },
    { path: '/credits', label: 'Créditos', icon: CreditCard, shortcut: '6' },
  ];

  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
    { path: '/institutions', label: 'Instituições', icon: Building2, shortcut: '2' },
    { path: '/audit', label: 'Auditoria', icon: Activity, shortcut: '3' },
  ];

  const visibleItems = isAdmin ? adminMenu : institutionMenu;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleNav = useCallback((item) => {
    if (item.external) {
      window.open('/verify', '_blank');
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    notify('Sessão terminada com sucesso', 'info');
    setTimeout(() => logout(), 300);
  }, [logout, notify]);

  const getBreadcrumbs = () => {
    const items = [{ label: 'Início', path: '/' }];
    const currentItem = visibleItems.find(item => isActive(item.path) && item.path !== '/');
    if (currentItem) items.push({ label: currentItem.label, path: currentItem.path });
    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.05] bg-slate-900/50 backdrop-blur-xl fixed h-full z-30">
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight">Txeka Ntiyiso</h1>
            <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider truncate">Infraestrutura de Verificação</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-2 pt-1">
            <p className="text-[0.6rem] uppercase tracking-wider text-slate-600 font-semibold">Menu Principal</p>
          </div>
          {visibleItems.map((item) => (
            <button key={item.path} onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive(item.path) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'}`}>
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive(item.path) ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {item.external && <span className="text-[0.6rem] text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded">Ext</span>}
              {isActive(item.path) && <div className="w-1 h-1 rounded-full bg-cyan-400" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.05] space-y-3">
          <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 text-[0.6rem] text-slate-600">
              <Keyboard className="w-3 h-3" />
              <span>Ctrl+K para pesquisar</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || user?.id || 'Utilizador'}</p>
              <p className="text-[0.6rem] text-slate-500 uppercase truncate">{isAdmin ? 'Administrador' : isInstitution ? 'Instituição' : 'Utilizador'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Terminar Sessão</span>
          </button>
        </div>
      </aside>

      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 transition-all ${scrolled ? 'bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.05] shadow-lg shadow-black/20' : 'bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.05]'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold">Txeka Ntiyiso</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all" aria-label="Pesquisar">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all" aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl pt-16 px-4 pb-4 overflow-y-auto animate-fade-in">
          <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{user?.name || user?.id || 'Utilizador'}</p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : isInstitution ? 'Instituição' : 'Utilizador'}</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {visibleItems.map((item) => (
              <button key={item.path} onClick={() => handleNav(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isActive(item.path) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/[0.03]'}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.external && <span className="text-[0.6rem] text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded ml-auto">Ext</span>}
              </button>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-white/[0.05] space-y-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" />
              Terminar Sessão
            </button>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-slate-500" />
              <input type="text" placeholder="Pesquisar páginas, documentos, instituições..." autoFocus
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none" />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-[0.65rem] text-slate-500">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-2">
              <div className="px-4 py-2 text-[0.6rem] uppercase tracking-wider text-slate-600 font-semibold">Páginas</div>
              {visibleItems.map((item) => (
                <button key={item.path} onClick={() => { handleNav(item); setSearchOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.shortcut && <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white/[0.05] text-[0.6rem] text-slate-600">{item.shortcut}</kbd>}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-white/[0.06] text-[0.6rem] text-slate-600 flex items-center justify-between">
              <span>Txeka Ntiyiso v2.0</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Atalho: Ctrl+K</span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="lg:hidden h-16" />
        <div className="hidden lg:block px-8 pt-6 pb-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-slate-300 truncate max-w-[200px]" aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="hover:text-cyan-400 transition-colors truncate max-w-[150px]">{crumb.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto p-4 lg:p-8 lg:pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

