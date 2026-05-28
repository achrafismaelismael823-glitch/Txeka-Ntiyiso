import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, History, Settings, LogOut, 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock, Search
} from 'lucide-react';

// Importação dos serviços e componentes do ecossistema
import { isAuthenticated, getCurrentUser, logout } from '../services/auth';
import VerificationForm from '../components/VerificationForm';
import ResultsDisplay from '../components/ResultsDisplay';

export default function DashboardPage() {
  // Estados de controlo lógico e dados reais
  const [result, setResult] = useState(null);
  const [lastHash, setLastHash] = useState('');
  const [history, setHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Segurança Intermitente: Bloqueio de rota caso não autenticado
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getCurrentUser();

  // Carregamento de infraestrutura local e verificação de saúde da API
  useEffect(() => {
    const savedHistory = localStorage.getItem('verificationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';
      // Chamada à rota raiz (/) configurada para retornar 200 OK
      const response = await fetch(`${apiUrl}/`);
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const handleVerificationResult = (verificationResult, hash) => {
    setResult(verificationResult);
    setLastHash(hash);
    
    // Atualização imediata do histórico operacional
    const newEntry = {
      hash,
      result: verificationResult,
      timestamp: new Date().toISOString(),
      type: verificationResult.documentType || "Documento Digital"
    };
    
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('verificationHistory', JSON.stringify(updatedHistory));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Filtro inteligente para a aba de histórico detalhado
  const filteredHistory = history.filter(item => 
    item.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      
      {/* 1. SIDEBAR CORPORATIVA */}
      <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-[#00D2C4]" />
            <span className="text-xl font-bold tracking-tight">Txeka<span className="text-[#00D2C4]">Ntiyiso</span></span>
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Custódia Espacializada</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setResult(null); }} />
          <NavItem icon={FileCheck} label="Validar Documento" active={activeTab === 'validate'} onClick={() => setActiveTab('validate')} />
          <NavItem icon={History} label="Histórico Integral" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-slate-400 font-semibold truncate">{user?.email}</p>
            <p className="text-[10px] text-[#00D2C4] font-medium uppercase tracking-wider">Operador Institucional</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full px-4 py-2.5 rounded-xl text-sm font-medium">
            <LogOut className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* 2. PAINEL DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER DE ESTADO */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center bg-opacity-95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Painel de Controlo Operacional'}
              {activeTab === 'validate' && 'Módulo de Escaneamento Criptográfico'}
              {activeTab === 'history' && 'Arquivo Auditável de Logs'}
            </h2>
            
            {/* Tag Dinâmica de Conetividade */}
            {apiStatus === 'online' ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> REDE ATIVA
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/50 animate-bounce">
                <AlertCircle size={10} /> API INACESSÍVEL
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="bg-slate-100 px-3 py-1 rounded-lg">MAPUTO, MZ</span>
          </div>
        </header>

        {/* CORPO DE RENDEREZADO DINÂMICO */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Metadados Operacionais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Validações Recentes" value={history.length} icon={History} color="text-blue-500" bg="bg-blue-500/5" />
                <StatCard label="Último Status Registado" value={history[0] ? (history[0].result?.status === 'success' ? 'Regular' : 'Incongruente') : 'Nenhum'} icon={ShieldCheck} color={history[0]?.result?.status === 'success' ? 'text-[#00D2C4]' : 'text-slate-400'} bg="bg-emerald-500/5" />
                <StatCard label="Segurança da Infraestrutura" value={apiStatus === 'online' ? '100% Integra' : 'Instável'} icon={AlertCircle} color={apiStatus === 'online' ? 'text-[#00D2C4]' : 'text-rose-500'} bg="bg-teal-500/5" />
              </div>

              {/* Tabela Resumida */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Auditoria de Operações Recentes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Visão condensada dos últimos registos gerados por esta máquina</p>
                  </div>
                  <button onClick={() => setActiveTab('history')} className="text-[#00D2C4] text-xs font-bold hover:text-[#00B2A6] transition-colors">Aceder ao Arquivo Completo</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Assinatura Digital (Hash SHA-256)</th>
                        <th className="px-6 py-3.5">Tipologia</th>
                        <th className="px-6 py-3.5">Data de Submissão</th>
                        <th className="px-6 py-3.5 text-right">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                      {history.slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-900 font-medium">{item.hash}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{item.type}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{new Date(item.timestamp).toLocaleString('pt-MZ')}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.result?.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.result?.status === 'success' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {item.result?.status === 'success' ? 'Válido' : 'Não Encontrado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum documento foi inspecionado até ao momento.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMULÁRIO DE VALIDAÇÃO OPERACIONAL */}
          {activeTab === 'validate' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Leitura Criptográfica de Metadados</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Insira o arquivo ou o hash digital para efetuar a validação direta na rede Txeka Ntiyiso.</p>
                </div>
                <VerificationForm onVerificationResult={handleVerificationResult} />
              </div>
              
              {result && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <ResultsDisplay result={result} hash={lastHash} />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTÓRICO INTEGRAL COM MOTOR DE BUSCA */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <Search className="text-slate-400 shrink-0" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por Hash SHA-256 ou tipo de documento..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Assinatura Digital (Hash)</th>
                        <th className="px-6 py-3.5">Categoria</th>
                        <th className="px-6 py-3.5">Timestamp Oficial</th>
                        <th className="px-6 py-3.5 text-right">Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                      {filteredHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => {
                          setResult(item.result);
                          setLastHash(item.hash);
                          setActiveTab('validate');
                        }}>
                          <td className="px-6 py-4 font-mono text-xs text-slate-900 selection:bg-[#00D2C4]/20">{item.hash}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{item.type}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{new Date(item.timestamp).toLocaleString('pt-MZ')}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.result?.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {item.result?.status === 'success' ? 'Autêntico' : 'Nível Crítico'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredHistory.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum registo corresponde aos critérios de pesquisa informados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// 3. COMPONENTES ATÓMICOS AUXILIARES (Altamente Otimizados)
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans ${
      active 
        ? 'bg-[#00D2C4]/10 text-[#00D2C4] shadow-inner font-bold' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'
    }`}>
      <Icon className={`h-4 w-4 ${active ? 'text-[#00D2C4]' : ''}`} />
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
    }
