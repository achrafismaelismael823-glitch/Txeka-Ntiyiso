import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, ExternalLink, ShieldCheck, FileText, Calendar, Hash, Fingerprint } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export const ResultsDisplay = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isValid = result.valid || result.status === 'active' || result.verified;

  const handleCopyHash = () => {
    const hash = result.hash || result.document_hash || result.verification_hash;
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusConfig = () => {
    if (isValid) {
      return {
        icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />,
        title: 'Documento Verificado',
        subtitle: 'Este documento é autêntico e encontra-se ativo no sistema.',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
      };
    }
    return {
      icon: <XCircle className="w-12 h-12 text-red-400" />,
      title: 'Documento Inválido',
      subtitle: result.message || 'Este documento não foi encontrado ou foi revogado.',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
    };
  };

  const status = getStatusConfig();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-scale-in">
      {/* Status Card */}
      <div className={`rounded-2xl border ${status.border} ${status.bg} p-8 text-center`}>
        <div className="flex justify-center mb-4">{status.icon}</div>
        <h2 className={`text-2xl font-bold ${status.text} mb-2`}>{status.title}</h2>
        <p className="text-slate-400 text-sm">{status.subtitle}</p>
      </div>

      {/* Document Details */}
      {isValid && result.document && (
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Detalhes do Documento</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={<FileText className="w-4 h-4" />} label="Tipo" value={result.document.type || 'N/A'} />
              <DetailItem icon={<Hash className="w-4 h-4" />} label="Número" value={result.document.number || 'N/A'} />
              <DetailItem icon={<Calendar className="w-4 h-4" />} label="Emitido em" value={formatDate(result.document.issued_at, { short: true })} />
              <DetailItem icon={<Calendar className="w-4 h-4" />} label="Expira em" value={formatDate(result.document.expires_at, { short: true })} />
              <DetailItem icon={<Fingerprint className="w-4 h-4" />} label="Hash" value={
                <button onClick={handleCopyHash} className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs">
                  {(result.document.hash || 'N/A').substring(0, 16)}...
                  {copied ? 'Copiado!' : <Copy className="w-3 h-3" />}
                </button>
              } />
              <DetailItem icon={<ShieldCheck className="w-4 h-4" />} label="Status" value={
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${result.document.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {result.document.status === 'active' ? 'Ativo' : 'Revogado'}
                </span>
              } />
            </div>
          </div>
        </div>
      )}

      {/* Institution Info */}
      {isValid && result.institution && (
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Instituição Emissora</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">{result.institution.name?.charAt(0) || 'I'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{result.institution.name || 'Instituição'}</p>
                <p className="text-xs text-slate-500">NUIT: {result.institution.nuit || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center">
        <button onClick={onReset} className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-slate-100 transition-all">
          Verificar outro documento
        </button>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-500">{icon}</div>
    <div>
      <p className="text-[0.65rem] uppercase tracking-wider text-slate-600 font-semibold">{label}</p>
      <p className="text-sm text-slate-300 mt-0.5">{value || 'N/A'}</p>
    </div>
  </div>
);

export default ResultsDisplay;
