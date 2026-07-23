import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, History, LogOut, 
  ShieldCheck, AlertCircle, Search, Clock, Hash, 
  CheckCircle2, XCircle, FileText, Wallet, Zap,
  Users, Building2, BarChart3, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

import { isAuthenticated, getCurrentUser, logout } from '../services/auth';
import { 
  checkApiHealth, getMyDashboard, getMyCredits, 
  getAuditStats, getAuditLogs, listInstitutions 
} from '../services/api';
import { formatDate } from '../utils/validation';
import VerificationForm from '../components/VerificationForm';
import ResultsDisplay from '../components/ResultsDisplay';

// ==================== STATUS HELPERS ====================
// API returns: "VALID" | "INVALID" | "EXPIRED" | "REVOKED"
function isValidStatus(status) {
  return status === 'VALID';
}

function getStatusLabel(status) {
  const labels = {
    VALID: 'VALIDO',
    INVALID: 'INVALIDO',
    EXPIRED: 'EXPIRADO',
    REVOKED: 'REVOGADO',
  };
  return labels[status] || status?.toUpperCase() || 'DESCONHECIDO';
}

function getStatusColor(status) {
  if (status === 'VALID') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' };
  if (status === 'INVALID') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600' };
  if (status === 'EXPIRED') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' };
  if (status === 'REVOKED') return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-600' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-600' };
}

export default function DashboardPage() {
  const [result, setResult] = useState(null);
  const [lastHash, setLastHash] = useState('');
  const [history, setHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [creditsData, setCreditsData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isInstitution = user?.role === 'institution';

  useEffect(() => {
    loadDashboardData();
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      if (isAdmin) {
        const [stats, institutions, logs] = await Promise.all([
          getAuditStats().catch(err => { console.warn('[Dashboard] Audit stats error:', err.translated?.message); return null; }),
          listInstitutions().catch(err => { console.warn('[Dashboard] Institutions error:', err.translated?.message); return null; }),
          getAuditLogs({ limit: 50 }).catch(err => { console.warn('[Dashboard] Audit logs error:', err.translated?.message); return []; }),
        ]);
        setAdminStats(stats);
        setInstitutionsList(institutions?.institutions || []);
        setAuditLogs(logs || []);
      } else {
        const [dashboard, credits] = await Promise.all([
          getMyDashboard().catch(err => { console.warn('[Dashboard] My dashboard error:', err.translated?.message); return null; }),
          getMyCredits().catch(err => { console.warn('[Dashboard] My credits error:', err.translated?.message); return null; }),
        ]);
        setDashboardData(dashboard);
        setCreditsData(credits);
      }
      const savedHistory = localStorage.getItem('verificationHistory');
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
      }
    } catch (error) {
      console.error('[Dashboard] Erro ao carregar dados:', error);
      setLoadError(error.translated || { message: 'Erro ao carregar dados do dashboard' });
    } finally {
      setLoading(false);
    }
  };

  const checkApiStatus = async () => {
    const isOnline = await checkApiHealth();
    setApiStatus(isOnline ? 'online' : 'offline');
  };

  const handleVerificationResult = (verificationResult, hash) => {
    setResult(verificationResult);
    setLastHash(hash);
    const docStatus = verificationResult?.status || 'INVALID';
    const newEntry = {
      hash, 
      result: verificationResult,
      status: docStatus,
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800 shrink-0">
        <SidebarHeader />
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} setResult={setResult} />
        <SidebarFooter user={user} creditsData={creditsData} handleLogout={handleLogout} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader activeTab={activeTab} apiStatus={apiStatus} institutionStatus={isInstitution ? (creditsData?.status || 'active') : null} />
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          {loading && <LoadingState />}
          {loadError && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-rose-700">Erro ao carregar dados</p>
                <p className="text-sm text-rose-600">{loadError.message}</p>
                <button onClick={loadDashboardData} className="mt-2 text-sm text-rose-700 underline hover:no-underline">Tentar novamente</button>
              </div>
            </div>
          )}
          {!loading && activeTab === 'overview' && (isAdmin ? 
            <AdminOverview stats={adminStats} institutions={institutionsList} auditLogs={auditLogs} /> :
            <InstitutionOverview dashboardData={dashboardData} creditsData={creditsData} result={result} lastHash={lastHash} setActiveTab={setActiveTab} />
          )}
          {!loading && activeTab === 'validate' && <ValidateTab result={result} lastHash={lastHash} handleVerificationResult={handleVerificationResult} />}
          {!loading && activeTab === 'history' && <HistoryTab history={history} filteredHistory={filteredHistory} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
          {!loading && isAdmin && activeTab === 'institutions' && <InstitutionsTab institutions={institutionsList} />}
          {!loading && isAdmin && activeTab === 'audit' && <AuditTab auditLogs={auditLogs} />}
        </main>
      </div>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="p-6 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-[#00D2C4]" />
        <span className="text-xl font-bold tracking-tight">Txeka<span className="text-[#00D2C4]">Ntiyiso</span></span>
      </div>
      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Custodia Especializada</p>
    </div>
  );
}

function SidebarNav({ activeTab, setActiveTab, isAdmin, setResult }) {
  return (
    <nav className="flex-1 p-4 space-y-1 mt-4">
      <NavItem icon={LayoutDashboard} label="Visao Geral" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setResult(null); }} />
      <NavItem icon={FileCheck} label="Validar Documento" active={activeTab === 'validate'} onClick={() => setActiveTab('validate')} />
      <NavItem icon={History} label="Historico Integral" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      {isAdmin && (
        <>
          <NavItem icon={Building2} label="Instituicoes" active={activeTab === 'institutions'} onClick={() => setActiveTab('institutions')} />
          <NavItem icon={BarChart3} label="Auditoria" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
        </>
      )}
    </nav>
  );
}

function SidebarFooter({ user, creditsData, handleLogout }) {
  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/30">
      <div className="px-4 py-2 mb-2">
        <p className="text-xs text-slate-400 font-semibold truncate">{user?.username || 'Operador'}</p>
        <p className="text-[10px] text-[#00D2C4] font-medium uppercase tracking-wider">{user?.role === 'admin' ? 'Administrador' : 'Operador Institucional'}</p>
        {creditsData && (
          <div className="flex items-center gap-1 mt-1">
            <Wallet className="h-3 w-3 text-amber-400" />
            <p className="text-[10px] text-amber-400 font-medium">{creditsData.credits} creditos</p>
          </div>
        )}
      </div>
      <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full px-4 py-2.5 rounded-xl text-sm font-medium">
        <LogOut className="h-4 w-4" /><span>Encerrar Sessao</span>
      </button>
    </div>
  );
}

function DashboardHeader({ activeTab, apiStatus, institutionStatus }) {
  const tabTitles = {
    overview: 'Painel de Controlo Operacional',
    validate: 'Modulo de Escaneamento Criptografico',
    history: 'Arquivo Auditavel de Logs',
    institutions: 'Gestao de Instituicoes',
    audit: 'Logs de Auditoria',
  };
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center bg-opacity-95 backdrop-blur-sm z-10 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">{tabTitles[activeTab]}</h2>
        {apiStatus === 'online' ? (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> REDE ATIVA
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/50">
            <AlertCircle size={10} /> API INACESSIVEL
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span className="bg-slate-100 px-3 py-1 rounded-lg">MAPUTO, MZ</span>
        {institutionStatus && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${institutionStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {institutionStatus.toUpperCase()}
          </span>
        )}
      </div>
    </header>
  );
}

function AdminOverview({ stats, institutions, auditLogs }) {
  const totalDocs = stats?.stats?.summary?.total_emitted_documents || stats?.total_documents || 0;
  const totalInstitutions = institutions?.length || 0;
  const activeInstitutions = institutions?.filter(i => i.status === 'active').length || 0;
  const totalVerifications = stats?.stats?.summary?.total_verifications || 0;
  const totalCredits = institutions?.reduce((sum, i) => sum + (i.credits || 0), 0) || 0;

  const monthlyData = [
    { month: 'Jan', emits: 120, verifies: 340 },
    { month: 'Fev', emits: 190, verifies: 420 },
    { month: 'Mar', emits: 150, verifies: 380 },
    { month: 'Abr', emits: 280, verifies: 560 },
    { month: 'Mai', emits: 220, verifies: 490 },
    { month: 'Jun', emits: 310, verifies: 620 },
  ];
  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.emits, d.verifies)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Documentos" value={totalDocs} color="blue" />
        <StatCard icon={Building2} label="Instituicoes Ativas" value={activeInstitutions} color="emerald" />
        <StatCard icon={CheckCircle2} label="Total Verificacoes" value={totalVerifications} color="violet" />
        <StatCard icon={Wallet} label="Creditos em Circulacao" value={totalCredits} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Emissoes vs Verificacoes por Mes
          </h3>
          <div className="space-y-3">
            {monthlyData.map((data, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{data.month}</span>
                  <span>{data.emits} emits / {data.verifies} verif</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(data.emits / maxValue) * 100}%` }}></div>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(data.verifies / maxValue) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Emissoes</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Verificacoes</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            Instituicoes por Status
          </h3>
          <div className="space-y-4">
            {['active', 'pending', 'suspended', 'inactive'].map(status => {
              const count = institutions?.filter(i => i.status === status).length || 0;
              const colors = { active: 'bg-emerald-500', pending: 'bg-amber-500', suspended: 'bg-rose-500', inactive: 'bg-slate-400' };
              const labels = { active: 'Ativas', pending: 'Pendentes', suspended: 'Suspensas', inactive: 'Inativas' };
              const pct = totalInstitutions > 0 ? (count / totalInstitutions) * 100 : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{labels[status]}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className={`${colors[status]} h-full rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Total de Instituicoes</p>
            <p className="text-2xl font-bold text-slate-900">{totalInstitutions}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${log.action === 'EMIT' ? 'bg-blue-500' : log.action === 'VERIFY' ? 'bg-emerald-500' : log.action === 'REVOKE' ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500">{log.institution_id} — {formatDate(log.created_at)}</p>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sem atividade recente</p>}
        </div>
      </div>
    </div>
  );
}

function InstitutionOverview({ dashboardData, creditsData, result, lastHash, setActiveTab }) {
  const totalEmitted = dashboardData?.total_emitted || 0;
  const totalVerifications = dashboardData?.total_verifications || 0;
  const credits = creditsData?.credits || 0;
  const docsEmittedMonth = creditsData?.docs_emitted_month || 0;
  const institutionStatus = creditsData?.status || 'active';
  const institution = dashboardData?.institution;
  const lowCredits = credits < 100;

  return (
    <div className="space-y-6">
      {lowCredits && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Creditos Baixos!</p>
            <p className="text-xs text-amber-700">Restam apenas {credits} creditos. Contacte o administrador para recarga.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Documentos Emitidos" value={totalEmitted} color="blue" />
        <StatCard icon={CheckCircle2} label="Total Verificacoes" value={totalVerifications} color="emerald" />
        <StatCard icon={Zap} label="Creditos Disponiveis" value={credits} color={lowCredits ? 'rose' : 'amber'} />
        <StatCard icon={FileCheck} label="Emitidos este Mes" value={docsEmittedMonth} color="violet" />
      </div>

      {institution && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Dados da Instituicao</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase">Nome</p>
              <p className="text-sm font-bold text-slate-900">{institution.name}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase">Plano</p>
              <p className="text-sm font-bold capitalize">{institution.subscription_plan}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase">Status</p>
              <p className="text-sm font-bold capitalize">{institution.status}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ultima Verificacao</h3>
          <ResultsDisplay result={result} hash={lastHash} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Acesso Rapido</h3>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('validate')} className="flex-1 bg-[#0B192C] hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            <FileCheck className="h-5 w-5" />Validar Novo Documento
          </button>
          <button onClick={() => setActiveTab('history')} className="flex-1 bg-white border-2 border-slate-200 hover:border-[#00D2C4] text-slate-700 px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            <History className="h-5 w-5" />Ver Historico Completo
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidateTab({ result, lastHash, handleVerificationResult }) {
  return (
    <div className="max-w-2xl mx-auto">
      <VerificationForm onVerificationResult={handleVerificationResult} />
      {result && <div className="mt-6"><ResultsDisplay result={result} hash={lastHash} /></div>}
    </div>
  );
}

function HistoryTab({ history, filteredHistory, searchTerm, setSearchTerm }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Pesquisar por hash ou tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00D2C4]" />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Nenhum registro no historico</p>
          <p className="text-slate-400 text-sm mt-1">Verifique um documento para comecar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => {
            const statusColors = getStatusColor(item.status);
            const isValid = isValidStatus(item.status);
            return (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${statusColors.bg} ${statusColors.icon}`}>
                      {isValid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
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
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors.bg} ${statusColors.text}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InstitutionsTab({ institutions }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Instituicoes Cadastradas</h3>
          <span className="text-sm text-slate-500">{institutions.length} total</span>
        </div>
        <div className="space-y-2">
          {institutions.map((inst) => (
            <div key={inst.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === inst.id ? null : inst.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${inst.status === 'active' ? 'bg-emerald-500' : inst.status === 'pending' ? 'bg-amber-500' : inst.status === 'suspended' ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{inst.name}</p>
                    <p className="text-xs text-slate-500">{inst.id} — {inst.contact_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{inst.credits} creditos</span>
                  {expandedId === inst.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>
              {expandedId === inst.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Plano</p>
                      <p className="text-sm font-bold capitalize">{inst.subscription_plan}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm font-bold capitalize">{inst.status}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Aprovado</p>
                      <p className="text-sm font-bold">{inst.approved ? 'Sim' : 'Nao'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Emitidos/Mes</p>
                      <p className="text-sm font-bold">{inst.docs_emitted_month}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditTab({ auditLogs }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Logs de Auditoria</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">Acao</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">Instituicao</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">Data</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${log.action === 'EMIT' ? 'bg-blue-50 text-blue-700' : log.action === 'VERIFY' ? 'bg-emerald-50 text-emerald-700' : log.action === 'REVOKE' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{log.institution_id || '-'}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{formatDate(log.created_at)}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{(log.details || '-').substring(0, 50)}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-slate-400">Sem logs de auditoria</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#00D2C4]/10 text-[#00D2C4] border border-[#00D2C4]/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
      <Icon className="h-5 w-5" /><span>{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: 'text-violet-600' },
  };
  const colors = colorClasses[color] || colorClasses.blue;
  return (
    <div className={`bg-white rounded-2xl border p-6 shadow-sm ${colors.border}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}><Icon className={`h-5 w-5 ${colors.icon}`} /></div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-[#00D2C4] animate-spin" />
      <span className="ml-3 text-slate-500 text-sm">Carregando dados...</span>
    </div>
  );
}

