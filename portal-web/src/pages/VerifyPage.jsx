// Página pública de verificação — Hash, File, QR Scanner. Reutiliza ResultsDisplay existente.
// Acessível SEM login. Consome GET /api/v1/verify/{hash} e POST /api/v1/verify

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyByHash, verifyByPost } from '../services/api';
import { calculateSHA256, validateSHA256Hash } from '../utils/crypto';
import ResultsDisplay from '../components/ResultsDisplay';
import {
  Search,
  Upload,
  ScanLine,
  Fingerprint,
  Loader2,
  AlertCircle,
  ShieldCheck,
  QrCode
} from 'lucide-react';

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [method, setMethod] = useState('hash'); // hash | file | qr
  const [hash, setHash] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Se veio ?hash=xxx na URL, verificar automaticamente
  useEffect(() => {
    const urlHash = searchParams.get('hash') || searchParams.get('verify');
    if (urlHash && validateSHA256Hash(urlHash)) {
      setHash(urlHash);
      setMethod('hash');
      handleVerify(urlHash);
    }
  }, []);

  const handleVerify = async (hashToVerify) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await verifyByHash(hashToVerify);
      setResult(response.data);
      // Guardar no histórico local
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      history.unshift({ timestamp: new Date().toISOString(), hash: hashToVerify, status: response.data.status });
      localStorage.setItem('verificationHistory', JSON.stringify(history.slice(0, 50)));
    } catch (err) {
      setError(err.userMessage || 'Documento não encontrado ou serviço indisponível.');
    } finally {
      setLoading(false);
    }
  };

  const handleHashSubmit = (e) => {
    e.preventDefault();
    if (!validateSHA256Hash(hash)) {
      setError('Hash inválido. Deve conter 64 caracteres hexadecimais.');
      return;
    }
    setSearchParams({ hash });
    handleVerify(hash);
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Seleccione um ficheiro PDF.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fileHash = await calculateSHA256(file);
      setHash(fileHash);
      await handleVerify(fileHash);
    } catch {
      setError('Erro ao calcular hash do ficheiro.');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError(null);
    } else {
      setError('Apenas ficheiros PDF são aceites.');
    }
  };

  // Simulação de scan QR (em produção usar biblioteca como html5-qrcode)
  const handleQRScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setError('Câmara QR não disponível nesta versão. Use o hash manual.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header público */}
      <header className="bg-[#0B192C] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#00D2C4] rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-[#0B192C]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Txeka Ntiyiso</h1>
          <p className="text-white/60 text-sm">Verificação Pública de Autenticidade Documental</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
          {/* Métodos */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {[
              { key: 'hash', label: 'Hash SHA-256', icon: Fingerprint },
              { key: 'file', label: 'Ficheiro PDF', icon: Upload },
              { key: 'qr', label: 'Escanear QR', icon: QrCode },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => { setMethod(m.key); setError(null); setResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                  method === m.key ? 'bg-white text-[#0B192C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <m.icon className="w-4 h-4" /> <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Form Hash */}
          {method === 'hash' && (
            <form onSubmit={handleHashSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Hash SHA-256 do Documento
                </label>
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value.toLowerCase().replace(/[^a-f0-9]/g, ''))}
                  placeholder="Cole os 64 caracteres do hash..."
                  maxLength={64}
                  className="w-full bg-slate-50 border border-slate-200 text-[#0B192C] text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4] focus:ring-2 focus:ring-[#00D2C4]/20 font-mono uppercase transition"
                />
                <p className="text-xs text-slate-400 mt-1">{hash.length}/64 caracteres</p>
              </div>
              <button
                type="submit"
                disabled={loading || hash.length !== 64}
                className="w-full bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> A verificar...</> : <><Search className="w-5 h-5" /> Verificar Autenticidade</>}
              </button>
            </form>
          )}

          {/* Form File */}
          {method === 'file' && (
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div
                onClick={() => document.getElementById('verify-file').click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-[#00D2C4] hover:bg-[#00D2C4]/5 transition"
              >
                <input id="verify-file" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#0B192C]">
                  {file ? file.name : 'Clique para seleccionar o PDF'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'O hash será calculado no seu browser'}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> A calcular hash...</> : <><Fingerprint className="w-5 h-5" /> Calcular Hash & Verificar</>}
              </button>
            </form>
          )}

          {/* QR Scanner */}
          {method === 'qr' && (
            <div className="text-center py-10">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ScanLine className={`w-10 h-10 text-slate-400 ${scanning ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-sm font-semibold text-[#0B192C] mb-2">Escanear Código QR</p>
              <p className="text-xs text-slate-400 mb-4">Aponte a câmara para o código QR do documento</p>
              <button
                onClick={handleQRScan}
                disabled={scanning}
                className="px-6 py-2.5 bg-[#00D2C4] hover:bg-[#00b8b0] text-white font-bold rounded-xl transition"
              >
                {scanning ? 'A iniciar câmara...' : 'Iniciar Scanner'}
              </button>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Resultado — reutiliza componente existente */}
          {result && <div className="mt-6"><ResultsDisplay result={result} hash={hash} /></div>}
        </div>

        {/* Footer público */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400">
            Txeka Ntiyiso — Middleware de Integridade Criptográfica • v2.0.0
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            Este serviço não armazena o conteúdo dos documentos. Apenas hashes SHA-256 de domínio público.
          </p>
        </div>
      </main>
    </div>
  );
}

