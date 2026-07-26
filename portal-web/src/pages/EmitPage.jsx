import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import ResultsDisplay from '../components/ResultsDisplay';
import {
  Upload, FileText, Loader2, AlertTriangle,
  FileUp, X
} from 'lucide-react';

const EmitPage = () => {
  const { notify } = useContext(NotificationContext);
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    document_type: '',
    description: '',
    holder_name: '',
    holder_id: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify('Selecione um ficheiro', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', metadata.document_type);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.holder_name) formData.append('holder_name', metadata.holder_name);
      if (metadata.holder_id) formData.append('holder_id', metadata.holder_id);

      const { data } = await endpoints.certify.single(formData);
      setResult(data);
      notify(data.message || 'Documento certificado', 'success');
      setFile(null);
      setMetadata({ document_type: '', description: '', holder_name: '', holder_id: '' });
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao certificar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Emitir Documento</h1>
        <p className="text-xs text-slate-500 mt-1">Certifique um documento com assinatura digital e QR Code</p>
      </div>

      <ResultsDisplay results={result} type="emit" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/[0.08] bg-white/[0.02]'
          }`}
        >
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <FileUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">
            {file ? file.name : 'Arraste um ficheiro ou clique para selecionar'}
          </p>
          <p className="text-xs text-slate-600 mt-1">PDF, PNG, JPG até 10MB</p>
          {file && (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
            >
              <X className="w-3 h-3" /> Remover
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Tipo de Documento *</label>
            <input
              type="text"
              required
              value={metadata.document_type}
              onChange={(e) => setMetadata({ ...metadata, document_type: e.target.value })}
              placeholder="Ex: CERTIFICADO"
              className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Descrição</label>
            <input
              type="text"
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Descrição opcional..."
              className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Nome do Titular</label>
            <input
              type="text"
              value={metadata.holder_name}
              onChange={(e) => setMetadata({ ...metadata, holder_name: e.target.value })}
              placeholder="Nome completo..."
              className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">ID do Titular</label>
            <input
              type="text"
              value={metadata.holder_id}
              onChange={(e) => setMetadata({ ...metadata, holder_id: e.target.value })}
              placeholder="BI / Passaporte / NUIT..."
              className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" />Certificar Documento</>}
        </button>
      </form>
    </div>
  );
};

export default EmitPage;

