import React, { useState } from 'react';
import { 
  LayoutDashboard, FileCheck, History, Settings, LogOut, 
  Search, ShieldCheck, TrendingUp, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Validadores Ativos', value: '12', icon: ShieldCheck, color: 'text-blue-400' },
    { label: 'Documentos Verificados', value: '1,284', icon: FileCheck, color: 'text-[#00D2C4]' },
    { label: 'Alertas de Fraude', value: '3', icon: AlertCircle, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-[#00D2C4]" />
            <span className="text-xl font-bold tracking-tight">Txeka<span className="text-[#00D2C4]">Ntiyiso</span></span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={FileCheck} label="Validar Documento" active={activeTab === 'validate'} onClick={() => setActiveTab('validate')} />
          <NavItem icon={History} label="Histórico de Logs" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('overview', 'Painel de Controle')}</h2>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <span>MAPUTO, MZ</span>
            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              U
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Cartões de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-10 w-10 ${stat.color} opacity-80`} />
              </div>
            ))}
          </div>

          {/* Secção de Atividade Recente */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Últimas Validações</h3>
              <button className="text-[#00D2C4] text-xs font-bold hover:underline">Ver tudo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">ID Documento</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600">
                  <TableRow id="DOC-8821" type="Certidão de Nascimento" time="Há 12 min" status="Autêntico" />
                  <TableRow id="DOC-7740" type="Título de Propriedade" time="Há 45 min" status="Pendente" />
                  <TableRow id="DOC-1102" type="BI Moçambicano" time="Ontem" status="Revogado" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Componentes Auxiliares (Para Limpeza de Código)
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-[#00D2C4]/10 text-[#00D2C4]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-[#00D2C4]' : ''}`} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function TableRow({ id, type, time, status }) {
  const statusStyles = {
    'Autêntico': 'bg-green-100 text-green-700',
    'Pendente': 'bg-amber-100 text-amber-700',
    'Revogado': 'bg-red-100 text-red-700'
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 font-mono font-medium text-slate-900">{id}</td>
      <td className="px-6 py-4">{type}</td>
      <td className="px-6 py-4 text-slate-400">{time}</td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
          }
