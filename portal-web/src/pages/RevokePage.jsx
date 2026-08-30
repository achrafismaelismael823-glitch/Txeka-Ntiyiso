import { useState } from 'react';
import { endpoints } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import {
  ShieldCheck, XCircle, CheckCircle2, Loader2, FileX,
  AlertTriangle, Hash, FileText, RotateCcw
} from 'lucide-react';

const RevokePage = () => {
  const { notify } = useNotification();
  const [docId, setDocId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!docId.trim() || !reason.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await endpoints.emissions.revoke(docId.trim(), reason.trim().substring(0, 255));
      setResult({ success: true, docId: docId.trim() });
      notify('Documento revogado com sucesso', 'success');
      setDocId('');
      setReason('');
    } catch (err) {
      const apiMessage = err.response?.data?.detail || err.response?.data?.message;
      const msg = apiMessage || err.message || 'Erro ao revogar documento';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDocId('');
    setReason('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
            <FileX className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Revogar Documento</h1>
          <p className="text-sm text-slate-500">
            Anule a validade de um documento emitido pela sua instituição.
          </p>
        </div>

        <form onSubmit={handleRevoke} className="space-y-5">
          {/* Doc ID */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" /> Identificador do Documento (Doc ID)
            </label>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder="Ex: DOC-2024-001234"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/30 text-sm font-mono"
              disabled={loading}
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Motivo da Revogação
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da revogação (máx. 255 caracteres)..."
              rows={3}
              maxLength={255}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/30 text-sm resize-none"
              disabled={loading}
            />
            <p className="text-[0.6rem] text-slate-600 text-right">{reason.length}/255</p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all text-sm font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Limpar
            </button>
            <button
              type="submit"
              disabled={loading || !docId.trim() || !reason.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><XCircle className="w-4 h-4" /> Revogar Documento</>
              )}
            </button>
          </div>
        </form>

        {/* Aviso */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Atenção</p>
            <p className="text-amber-400/70 leading-relaxed">
              A revogação é irreversível. O documento continuará verificável, mas será marcado como
              <strong> revogado</strong> com o motivo registrado em auditoria.
            </p>
          </div>
        </div>

        {/* Resultado de sucesso */}
        {result && (
          <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">Documento Revogado</h3>
            <p className="text-sm text-slate-500">
              O documento <code className="text-cyan-400 font-mono text-xs">{result.docId}</code> foi revogado com sucesso.
            </p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-slate-900/80 border border-red-500/20 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-red-400">Erro na Revogação</h3>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevokePage;
