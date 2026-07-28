import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileStack, Loader2, AlertTriangle, CheckCircle2, XCircle,
  FileText, Download, Upload
} from 'lucide-react';

const BulkEmitPage = () => {
  const { institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const examplePayload = [
    {
      document_type: 'Certidão de Nascimento',
      holder_name: 'João Silva',
      holder_id: '123456789',
      institution_id: institutionId || 'SUA_INST',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      notify('Cole o JSON com os documentos', 'error');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(jsonInput);
      if (!Array.isArray(payload)) throw new Error('O payload deve ser um array');
    } catch {
      notify('JSON inválido. Verifique a sintaxe', 'error');
      return;
    }

    try {
      setLoading(true);
      const { data } = await endpoints.certify.bulk({ documents: payload });
      setResults(data);
      notify(`Emissão massiva concluída: ${data.successful?.length || 0} sucesso(s)`, 'success');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro na emissão massiva', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(examplePayload, null, 2));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Emissão Massiva</h1>
        <p className="text-xs text-slate-500 mt-1">Emita múltiplos documentos via JSON</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={loadExample}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 transition-all"
        >
          <FileText className="w-3.5 h-3.5" /> Carregar exemplo
        </button>
        <button
          type="button"
          onClick={() => setJsonInput('')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-red-400 transition-all"
        >
          <XCircle className="w-3.5 h-3.5" /> Limpar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`[\n  {\n    "document_type": "Certidão",\n    "holder_name": "Nome",\n    "holder_id": "ID",\n    "institution_id": "${institutionId || 'INST'}"\n  }\n]`}
            className="w-full h-80 px-4 py-3 bg-black/20 border border-white/[0.06] rounded-2xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 text-xs font-mono resize-none"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !jsonInput.trim()}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
          {loading ? 'A processar...' : 'Emitir em Massa'}
        </button>
      </form>

      {results && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">{results.successful?.length || 0}</p>
              <p className="text-xs text-emerald-400/70 uppercase tracking-wider">Sucessos</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-400">{results.failed?.length || 0}</p>
              <p className="text-xs text-red-400/70 uppercase tracking-wider">Falhas</p>
            </div>
          </div>

          {/* Sucessos */}
          {results.successful?.length > 0 && (
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-100">Emitidos com sucesso</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.03]">
                {results.successful.map((doc, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <p className="text-sm text-slate-200">{doc.document_type || 'Documento'}</p>
                      <p className="text-xs font-mono text-slate-500">{doc.doc_id || doc.hash?.substring(0, 16)}...</p>
                    </div>
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
                      OK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Falhas */}
          {results.failed?.length > 0 && (
            <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-slate-100">Falhas</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.03]">
                {results.failed.map((err, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-white/[0.02]">
                    <p className="text-sm text-slate-300">{err.document?.document_type || `Item ${i + 1}`}</p>
                    <p className="text-xs text-red-400/80">{err.error || 'Erro desconhecido'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkEmitPage;

