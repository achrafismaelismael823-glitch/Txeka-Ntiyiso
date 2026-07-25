import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { endpoints } from '../services/api';
import { generateSHA256 } from '../utils/crypto';
import { validateEmitForm } from '../utils/validation';
import { EmitResult } from '../components/ResultsDisplay';

const EmitPage = () => {
  const { addToast } = useOutletContext();
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('DUAT');
  const [institutionId, setInstitutionId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previewHash, setPreviewHash] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f?.type !== 'application/pdf') {
      addToast('Apenas arquivos PDF são permitidos', 'error');
      return;
    }
    setFile(f);
    setErrors([]);
    setResult(null);
    try {
      const hash = await generateSHA256(f);
      setPreviewHash(hash);
    } catch {
      setPreviewHash('');
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setResult(null);
    const validationErrors = validateEmitForm(file, docType, institutionId);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await endpoints.certify.emit(formData, {
        document_type: docType,
        institution_id: institutionId,
      });
      setResult(data);
      addToast('Documento emitido com sucesso!', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail?.[0]?.msg || 'Erro ao emitir documento';
      setErrors([msg]);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Emitir Documento</h1>
        <p className="text-sm text-silver-dark mt-1">Certifique um documento PDF com hash SHA-256 e QR code</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-cyan bg-cyan/5' 
                : 'border-tn-500/40 hover:border-cyan/50 hover:bg-tn-800/40'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-cyan" />
                <div className="text-left">
                  <p className="text-sm font-medium text-silver-light">{file.name}</p>
                  <p className="text-xs text-silver-dark">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewHash(''); }}
                  className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-silver-dark" />
                <p className="text-sm text-silver">
                  {isDragActive ? 'Solte o PDF aqui' : 'Arraste um PDF ou clique para selecionar'}
                </p>
                <p className="text-xs text-silver-dark">Apenas arquivos PDF • Máx. 10MB</p>
              </div>
            )}
          </div>

          {previewHash && (
            <div className="p-3 rounded-lg bg-tn-800/50 border border-cyan/20">
              <p className="text-xs text-silver-dark mb-1">Pré-visualização do Hash SHA-256</p>
              <p className="text-xs font-mono text-cyan break-all">{previewHash}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Tipo de Documento</label>
              <input
                type="text"
                value={docType}
                onChange={(e) => setDocType(e.target.value.toUpperCase())}
                placeholder="Ex: DUAT"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-2">ID da Instituição</label>
              <input
                type="text"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                placeholder="Ex: INAGE"
                className="input-field"
              />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {err}
                </p>
              ))}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'A processar...' : 'Emitir Documento'}
          </button>
        </form>
      </div>

      {result && <EmitResult data={result} />}
    </div>
  );
};

export default EmitPage;

