import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileCheck, History, Settings, LogOut, 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock, Search
} from 'lucide-react';

import { isAuthenticated, getCurrentUser, logout } from '../services/auth';
import VerificationForm from '../components/VerificationForm';
import ResultsDisplay from '../components/ResultsDisplay';

export default function DashboardPage() {
  // Estados da aplicação
  const [result, setResult] = useState(null);
  const [lastHash, setLastHash] = useState('');
  const [history, setHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Protege rota
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getCurrentUser();

  // Carrega histórico e verifica API
  useEffect(() => {
    const savedHistory = localStorage.getItem('verificationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    checkApiStatus();
  }, []);

  // Verifica estado da API
  const checkApiStatus = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';
      const response = await fetch(`${apiUrl}/`);
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  // Atualiza resultado e histórico
  const handleVerificationResult = (verificationResult, hash) => {
    setResult(verificationResult);
    setLastHash(hash);
    
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

  // Logout
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Filtra histórico
  const filteredHistory = history.filter(item => 
    item.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-800">
      
      {/* Sidebar */}
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
            
            {/* Estado da API */}
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

        {/* Conteúdo dinâmico */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          
          {/* Aba overview */}
          {activeTab === 'overview' && (/* ...mantido igual... */)}

          {/* Aba validação */}
          {activeTab === 'validate' && (/* ...mantido igual... */)}

          {/* Aba histórico */}
          {activeTab === 'history' && (/* ...mantido igual... */)}

        </main>
      </div>
    </div>
  );
}

// Item de navegação
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={
