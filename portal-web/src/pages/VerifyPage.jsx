import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import {
  Search, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, FileText, Building2, Calendar, Hash, QrCode
} from 'lucide-react';

const VerifyPage = () => {
  const { hash: urlHash } = useParams();
  const navigate = useNavigate();
  const [hash, setHash] = useState(urlHash || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const cleanHash = hash.trim();
      const { data } = await endpoints.verify.public(cleanHash);
      setResult(data);
      if (!urlHash) navigate(`/verify/${cleanHash}`, { replace: true });
    } catch (err) {
      setError(err.normalizedMessage || 'Documento não encontrado ou inválido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlHash) handleVerify();
  }, [urlHash]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mx-auto">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Verificação de Documento</h1>
          <p className="text-sm text-slate-500">
            Valide a autenticidade de qualquer documento na rede Txeka Ntiyiso
          </p>
        </div>

        <form onSubmit={handleVerify} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Insira o hash do documento..."
            className="w-full pl-12 pr-32 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono"
          />
          <button
            type="submit"
            disabled={loading || !hash.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-30 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
          </button>
        </form>

        {error && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 text-center space-y-3">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-red-400">Documento Inválido</h3>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-400">Documento Autêntico</h3>
                <p className="text-xs text-slate-500">Certificado na blockchain Txeka Ntiyiso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
                  <FileText className="w-3 h-3" /> Tipo
                </div>
                <p className="text-sm font-medium text-slate-100">
                  {result.document_type || 'Documento Certificado'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
                  <Building2 className="w-3 h-3" /> Instituição
                </div>
                <p className="text-sm font-medium text-slate-100">
                  {result.institution_name || result.institution_id}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" /> Emitido em
                </div>
                <p className="text-sm font-medium text-slate-100">
                  {result.issued_at ? new Date(result.issued_at).toLocaleString('pt-MZ') : '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
                  <Hash className="w-3 h-3" /> Hash
                </div>
                <p className="text-xs font-mono text-cyan-400 truncate">{result.hash}</p>
              </div>
            </div>

            {result.revoked && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-400">Documento Revogado</p>
                  <p className="text-xs text-red-400/70">
                    {result.revoke_reason || 'Este documento foi revogado pela instituição emissora'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <div className="p-3 rounded-xl bg-white border border-white/[0.1]">
                <QrCode className="w-24 h-24 text-slate-950" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
