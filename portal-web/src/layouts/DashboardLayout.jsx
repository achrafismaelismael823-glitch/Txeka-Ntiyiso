import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, FileText, CreditCard, Users, Activity,
  FileCheck, Settings, LogOut, ShieldCheck, QrCode, Menu, X
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', admin: false },
    { to: '/documents', icon: FileText, label: 'Documentos', admin: false },
    { to: '/emit', icon: FileCheck, label: 'Emitir', admin: false },
    { to: '/bulk-emit', icon: FileText, label: 'Emissão Massiva', admin: false },
    { to: '/credits', icon: CreditCard, label: 'Créditos', admin: false },
    { to: '/institutions', icon: Users, label: 'Instituições', admin: true },
    { to: '/audit', icon: Activity, label: 'Auditoria', admin: true },
    { to: '/settings', icon: Settings, label: 'Configurações', admin: false },
  ];

  const visible = navItems.filter((item) => !item.admin || isAdmin);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">Txeka Ntiyiso</h1>
            <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Portal de Gestão</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border border-transparent'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <NavLink
              to="/verify"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] transition-all"
            >
              <QrCode className="w-4 h-4" />
              Verificador Público
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="px-3 py-2 mb-3">
            <p className="text-xs font-medium text-slate-100 truncate">{user?.name || user?.id}</p>
            <p className="text-[0.6rem] text-slate-500 uppercase">
              {isAdmin ? 'Administrador' : user?.id}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-white/[0.03] text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-100">Txeka Ntiyiso</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

