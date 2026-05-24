// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VerificationForm from '../components/VerificationForm';
import ResultsDisplay from '../components/ResultsDisplay';
import { isAuthenticated, getCurrentUser } from '../services/auth';
import { AlertCircle, History } from 'lucide-react';

export default function DashboardPage() {
  const [result, setResult] = useState(null);
  const [lastHash, setLastHash] = useState('');
  const [history, setHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

  // Verificar autenticação
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getCurrentUser();

  // Carregar histórico ao montar componente
  useEffect(() => {
    const savedHistory = localStorage.getItem('verificationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Verificar disponibilidade da API
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const handleVerificationResult = (verificationResult, hash) => {
    setResult(verificationResult);
    setLastHash(hash);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Container Principal */}
      <div className="container-main">
        {/* Aviso de API Offline */}
        {apiStatus === 'offline' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-warning flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-warning">API Indisponível</p>
              <p className="text-sm text-gray-700">
                A API de DocVerify MZ não está respondendo. Verifique se o servidor está operacional.
              </p>
            </div>
          </div>
        )}

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2">
            <VerificationForm onVerificationResult={handleVerificationResult} />
            <ResultsDisplay result={result} hash={lastHash} />
          </div>

          {/* Coluna Lateral - Histórico */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <History size={20} />
                Histórico
              </h3>

              {history.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">
                  Nenhuma verificação realizada ainda.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 text-xs hover:bg-gray-100 cursor-pointer transition"
                      onClick={() => {
                        setResult(item.result);
                        setLastHash(item.hash);
                      }}
                    >
                      <p className="font-mono font-semibold text-primary truncate">
                        {item.hash.substring(0, 16)}...
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(item.timestamp).toLocaleString('pt-MZ')}
                      </p>
                      <p className={`mt-1 font-semibold ${
                        item.result?.status === 'success' ? 'text-success' : 'text-danger'
                      }`}>
                        {item.result?.status === 'success' ? '✓ Encontrado' : '✗ Não encontrado'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
