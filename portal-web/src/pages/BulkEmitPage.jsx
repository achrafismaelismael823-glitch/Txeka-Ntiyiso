import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Upload, FileText, Loader2, AlertTriangle, CheckCircle2,
  FileUp, X, List, Hash
} from 'lucide-react';

const BulkEmitPage = () => {
  const { notify } = useContext(NotificationContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const addDocument = () => {
    setDocuments([...documents, {
      id: crypto.randomUUID(),
      document_type: '',
      description: '',
      holder_name: '',
      holder_id: '',
      content_base64: '',
      filename: '',
    }]);
  };

  const removeDocument = (id) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const updateDocument = (id, field, value) => {
    setDocuments(documents.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleFileRead = async (id, file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        updateDocument(id, 'content_base64', base64);
        updateDocument(id, 'filename', file.name);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileRead(id, file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      notify('Adicione pelo menos um documento', 'error');
      return;
    }
    const invalid = documents.filter((d) => !d.document_type || !d.content_base64);
    if (invalid.length > 0) {
      notify('Preencha o tipo e o ficheiro de todos os documentos', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        documents: documents.map((d) => ({
          document_type: d.document_type,
          description: d.description,
          holder_name: d.holder_name,
          holder_id: d.holder_id,
          content_base64: d.content_base64,
          filename: d.filename,
        })),
      };
      const { data } = await endpoints.certify.bulk(payload);
      setResults(data);
      notify(`${data.successful?.length || 0} documentos certificados com sucesso`, 'success');
      if (data.failed?.length > 0) {
        notify(`${data.failed.length} falhas na emissão`, 'error');
      }
    } catch (err) {
      notify(err.normalizedMessage || 'Erro na emissão massiva', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Emissão Massiva</h1>
          <p className="text-xs text-slate-500 mt-1">Certifique múltiplos documentos de uma só vez</p>
        </div>
        <button onClick={addDocument} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all">
          <FileText className="w-4 h-4" />Adicionar Documento
        </button>
      </div>

      {results && (
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Resultado da Emissão</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-emerald-400 font-bold text-lg">{results.successful?.length || 0}</p>
              <p className="text-slate-500">Sucessos</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 font-bold text-lg">{results.failed?.length || 0}</p>
              <p className="text-slate-500">Falhas</p>
            </div>
          </div>
          {results.successful?.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.successful.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-cyan-400">{s.hash?.substring(0, 20)}...</span>
                  <span className="text-slate-500">{s.document_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-100">Documento</span>
              </div>
              <button type="button" onClick={() => removeDocument(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Tipo *</label>
                <input type="text" required value={doc.document_type} onChange={(e) => updateDocument(doc.id, 'document_type', e.target.value)} placeholder="Ex: Certificado" className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Descrição</label>
                <input type="text" value={doc.description} onChange={(e) => updateDocument(doc.id, 'description', e.target.value)} placeholder="Descrição..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Nome do Titular</label>
                <input type="text" value={doc.holder_name} onChange={(e) => updateDocument(doc.id, 'holder_name', e.target.value)} placeholder="Nome..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">ID do Titular</label>
                <input type="text" value={doc.holder_id} onChange={(e) => updateDocument(doc.id, 'holder_id', e.target.value)} placeholder="BI / Passaporte..." className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Ficheiro *</label>
                <div className="relative">
                  <input type="file" onChange={(e) => handleFileSelect(doc.id, e)} className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400" />
                  {doc.filename && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{doc.filename}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12 bg-slate-900/30 border border-dashed border-white/[0.06] rounded-2xl">
            <FileUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum documento adicionado</p>
            <button type="button" onClick={addDocument} className="mt-3 text-sm text-cyan-400 hover:underline">Adicionar primeiro documento</button>
          </div>
        )}

        {documents.length > 0 && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" />Certificar {documents.length} Documento(s)</>}
          </button>
        )}
      </form>
    </div>
  );
};

export default BulkEmitPage;

