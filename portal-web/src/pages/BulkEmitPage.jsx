import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { endpoints } from '../services/api';
import { fileToBase64 } from '../utils/crypto';

const BulkEmitPage = () => {
  const { addToast } = useOutletContext();
  const [institutionId, setInstitutionId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const newDocs = await Promise.all(
      acceptedFiles.filter(f => f.type === 'application/pdf').map(async (file) => ({
        file_name: file.name,
        document_type: 'DUAT',
        content: await fileToBase64(file),
        size: file.size,
      }))
    );
    setDocuments(prev => [...prev, ...newDocs]);
    if (newDocs.length < acceptedFiles.length) {
      addToast('Apenas arquivos PDF foram adicionados', 'warning');
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const updateDoc = (idx, field, value) => {
    setDocuments(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const removeDoc = (idx) => {
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionId.trim()) {
      addToast('ID da instituição é obrigatório', 'error');
      return;
    }
    if (documents.length === 0) {
      addToast('Adicione pelo menos um documento', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        institution_id: institutionId,
        documents: documents.map(({ size, ...rest }) => rest),
      };
      const { data } = await endpoints.certify.bulk(payload);
      setResult(data);
      addToast(`${documents.length} documentos emitidos com sucesso!`, 'success');
      setDocuments([]);
    } catch (err) {
      addToast(err.response?.data?.detail?.[0]?.msg || 'Erro na emissão em massa', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Emissão em Massa</h1>
        <p className="text-sm text-silver-dark mt-1">Emita múltiplos documentos de uma só vez (B2B/B2G)</p>
      </div>

      <div className="glass-panel p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-silver mb-2">ID da Instituição</label>
          <input
            type="text"
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
            placeholder="Ex: INAGE"
            className="input-field max-w-md"
          />
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-cyan bg-cyan/5' : 'border-tn-500/40 hover:border-cyan/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto text-silver-dark mb-2" />
          <p className="text-sm text-silver">
            {isDragActive ? 'Solte os PDFs aqui' : 'Arraste múltiplos PDFs ou clique para selecionar'}
          </p>
        </div>

        {documents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-silver">{documents.length} documento(s) adicionado(s)</p>
              <button onClick={() => setDocuments([])} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Limpar todos
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-tn-800/50 border border-tn-500/20">
                  <FileText className="w-5 h-5 text-cyan shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-silver truncate">{doc.file_name}</p>
                    <p className="text-xs text-silver-dark">{(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <input
                    type="text"
                    value={doc.document_type}
                    onChange={(e) => updateDoc(idx, 'document_type', e.target.value.toUpperCase())}
                    placeholder="Tipo"
                    className="w-24 px-2 py-1 text-xs bg-tn-700 border border-tn-500/30 rounded text-silver-light"
                  />
                  <button onClick={() => removeDoc(idx)} className="p-1 rounded hover:bg-red-500/20">
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'A processar...' : `Emitir ${documents.length} Documento(s)`}
        </button>
      </div>

      {result && (
        <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-silver-light">Emissão Concluída</h3>
          </div>
          <pre className="text-xs text-silver-dark overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default BulkEmitPage;

