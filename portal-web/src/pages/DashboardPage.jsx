import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, History, LogOut, 
  ShieldCheck, AlertCircle, Search, Clock, Hash, 
  CheckCircle2, XCircle, FileText
} from 'lucide-react';

import { isAuthenticated, getCurrentUser, logout } from '../services/auth';
import { checkApiHealth } from '../services/api';
import { formatDate } from '../utils/validation';
import VerificationForm from '../components/VerificationForm';
import ResultsDisplay from '../components/ResultsDisplay';

export default function DashboardPage() {
  const [result, setResult] = useState(null);
  const [lastHash, setLastHash] = useState('');
  const [history, setHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getCurrentUser();

  useEffect(() => {
    const savedHistory = localStorage.getItem('verificationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    const isOnline = await checkApiHealth();
    setApiStatus(isOnline ? 'online' : 'offline');
  };

  const handleVerificationResult = (verificationResult, hash) => {
    setResult(verificationResult);
    setLastHash(hash);
    
    const newEntry = {
      hash,
      result: verificationResult,
      timestamp: new Date().toISOString(),
      type: verificationResult.dados_publicos?.document_type || "Documento Digital"
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('verificationHistory', JSON.stringify(updatedHistory));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const filteredHistory = history.filter(item => 
    item.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalVerifications = history.length;
  const validDocs = history.filter(h => h.result?.status === 'success').length;
  const revokedDocs = history.filter(h => h.result?.dados_publicos?.revoked).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-[#00D2C4]" />
            <span className="text-xl font-bold tracking-tight">Txeka<span className="text-[#00D2C4]">Ntiyiso</span></span>
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Custódia Especializada</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setResult(null); }} />
          <NavItem icon={FileCheck} label="Validar Documento" active={activeTab === 'validate'} onClick={() => setActiveTab('validate')} />
          <NavItem icon={History} label="Histórico Integral" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-slate-400 font-semibold truncate">{user?.username || 'Operador'}</p>
            <p className="text-[10px] text-[#00D2C4] font-medium uppercase tracking-wider">{user?.role === 'admin' ? 'Administrador' : 'Operador Institucional'}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full px-4 py-2.5 rounded-xl text-sm font-medium">
            <LogOut className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center bg-opacity-95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Painel de Controlo Operacional'}
              {activeTab === 'validate' && 'Módulo de Escaneamento Criptográfico'}
              {activeTab === 'history' && 'Arquivo Auditável de Logs'}
            </h2>
            
            {apiStatus === 'online' ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> REDE ATIVA
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/50">
                <AlertCircle size={10} /> API INACESSÍVEL
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="bg-slate-100 px-3 py-1 rounded-lg">MAPUTO, MZ</span>
          </div>
        </header>

        {/* Conteúdo dinâmico */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          
          {/* Aba overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={FileText} label="Total Verificações" value={totalVerifications} color="blue" />
                <StatCard icon={CheckCircle2} label="Documentos Válidos" value={validDocs} color="emerald" />
                <StatCard icon={XCircle} label="Documentos Revogados" value={revokedDocs} color="rose" />
              </div>

              {result && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Última Verificação</h3>
                  <ResultsDisplay result={result} hash={lastHash} />
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Acesso Rápido</h3>
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('validate')} className="flex-1 bg-[#0B192C] hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                    <FileCheck className="h-5 w-5" /> Validar Novo Documento
                  </button>
                  <button onClick={() => setActiveTab('history')} className="flex-1 bg-white border-2 border-slate-200 hover:border-[#00D2C4] text-slate-700 px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                    <History className="h-5 w-5" /> Ver Histórico Completo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba validação */}
          {activeTab === 'validate' && (
            <div className="max-w-2xl mx-auto">
              <VerificationForm onVerificationResult={handleVerificationResult} />
              {result && <div className="mt-6"><ResultsDisplay result={result} hash={lastHash} /></div>}
            </div>
          )}

          {/* Aba histórico */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder="Pesquisar por hash ou tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00D2C4]" />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Nenhum registro no histórico</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${item.result?.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {item.result?.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.type || 'Documento'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Hash className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-500 font-mono">{item.hash.substring(0, 16)}...</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-400">{formatDate(item.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.result?.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {item.result?.status === 'success' ? 'VÁLIDO' : 'INVÁLIDO'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#00D2C4]/10 text-[#00D2C4] border border-[#00D2C4]/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={`bg-white rounded-2xl border p-6 shadow-sm ${colorClasses[color]?.split(' ')[2] || 'border-slate-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]?.split(' ').slice(0, 2).join(' ')}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

