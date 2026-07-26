import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Upload, FileText, Loader2, AlertTriangle, CheckCircle2,
  FileUp, X, Hash
} from 'lucide-react';

const EmitPage = () => {
  const { user, isInstitution, institutionId } = useAuth();
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

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify('Selecione um ficheiro para certificar', 'error');
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
      notify('Documento certificado com sucesso', 'success');
      setFile(null);
      setMetadata({ document_type: '', description: '', holder_name: '', holder_id: '' });
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao certificar documento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Emitir Documento</h1>
        <p className="text-xs text-slate-500 mt-1">Certifique um único documento na blockchain</p>
      </div>

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400">Documento Certificado</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Hash: <span className="font-mono text-cyan-400">{result.hash}</span></p>
            <p className="text-xs text-slate-400">Instituição: <span className="font-mono text-slate-200">{result.institution_id}</span></p>
          </div>
          <button onClick={() => window.open(`/verify/${result.hash}`, '_blank')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            Verificar documento <Hash className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/[0.08] bg-white/[0.02]'
          }`}
        >
          <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <FileUp className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">
            {file ? file.name : 'Arraste um ficheiro ou clique para selecionar'}
          </p>
          <p className="text-xs text-slate-600 mt-1">PDF,até 10MB</p>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto">
              <X className="w-3 h-3" /> Remover
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Tipo de Documento *</label>
            <input type="text" required value={metadata.document_type} onChange={(e) => setMetadata({ ...metadata, document_type: e.target.value })} placeholder="Ex: Certificado, Diploma..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Descrição</label>
            <input type="text" value={metadata.description} onChange={(e) => setMetadata({ ...metadata, description: e.target.value })} placeholder="Descrição opcional..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Nome do Titular</label>
            <input type="text" value={metadata.holder_name} onChange={(e) => setMetadata({ ...metadata, holder_name: e.target.value })} placeholder="Nome do titular..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">ID do Titular</label>
            <input type="text" value={metadata.holder_id} onChange={(e) => setMetadata({ ...metadata, holder_id: e.target.value })} placeholder="BI / Passaporte..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
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

