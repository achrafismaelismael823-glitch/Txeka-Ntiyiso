import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { useApi } from '../hooks/useApi';
import {
  Upload, FileText, X, Shield, AlertCircle, CheckCircle2,
  Loader2, ChevronRight, Copy, ExternalLink, Tag, PenLine,
} from 'lucide-react';

const DEFAULT_DOC_TYPES = [
  'DUAT',
  'CERTIFICADO',
  'ATESTADO',
  'ALVARA',
  'CERTIDAO',
  'LICENCA',
  'DECLARACAO',
  'RELATORIO',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EmitPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const mutation = useApi({ showSuccessToast: true, showErrorToast: true });

  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('DUAT');
  const [customType, setCustomType] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const fileInputRef = useRef(null);

  const institutionIdValue = isAdmin && institutionId
    ? institutionId
    : user?.institution?.id || user?.id;

  const validateFile = (f) => {
    if (!f) return 'Seleccione um ficheiro';
    if (f.size > MAX_FILE_SIZE) return 'Ficheiro excede 10 MB';
    if (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf')) {
      return 'Apenas ficheiros PDF são aceites';
    }
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) {
      mutation.execute(() => Promise.reject(new Error(err)));
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    params.append('document_type', docType.toUpperCase().trim());
    if (institutionIdValue) params.append('institution_id', institutionIdValue);

    const res = await mutation.execute(() =>
      endpoints.emissions.certify(formData, params.toString())
    );

    if (res.success) {
      setResult(res.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Shield className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Emitir Documento</h1>
          <p className="text-sm text-slate-400">
            Carregue um PDF para gerar hash SHA-256, QR code e certificado de autenticidade
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Tipo de Documento
            </label>
            <button
              type="button"
              onClick={() => setCustomType(!customType)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <PenLine className="w-3 h-3" />
              {customType ? 'Usar sugestões' : 'Tipo personalizado'}
            </button>
          </div>

          {customType ? (
            <input
              type="text"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="Ex: PORTARIA, MEMORANDO, OFICIO..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
              required
            />
          ) : (
            <div className="relative">
              <input
                type="text"
                list="doc-types"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Escolha ou digite o tipo..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
              <datalist id="doc-types">
                {DEFAULT_DOC_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500 mt-1.5">
                Pode seleccionar da lista ou digitar um tipo personalizado
              </p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ID da Instituição <span className="text-slate-500">(modo admin)</span>
            </label>
            <input
              type="text"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              placeholder="Deixe em branco para usar a sua instituição"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10'
              : file
              ? 'border-cyan-500/30 bg-cyan-500/5'
              : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-cyan-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • PDF
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">
                <span className="text-cyan-400 font-medium">Clique</span> ou arraste o PDF aqui
              </p>
              <p className="text-xs text-slate-500">Máx. 10 MB • Apenas PDF</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!file || mutation.loading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-cyan-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {mutation.loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A processar...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Certificar Documento
            </>
          )}
        </button>

        {mutation.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Erro na emissão</p>
              <p className="text-xs text-red-400/80 mt-1">{mutation.error}</p>
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="space-y-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-emerald-300">Documento Certificado</h2>
          </div>

          <p className="text-sm text-slate-400">{result.message}</p>

          {result.qr_code && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.03]">
              <img
                src={result.qr_code}
                alt="QR Code de verificação"
                className="w-48 h-48 rounded-lg"
              />
              <p className="text-xs text-slate-500">Escaneie para verificar autenticidade</p>
            </div>
          )}

          <div className="grid gap-3">
            <ResultRow
              label="Doc ID"
              value={result.doc_id}
              copyable
              onCopy={handleCopy}
              copied={copiedField === 'doc_id'}
              field="doc_id"
            />
            <ResultRow
              label="Hash SHA-256"
              value={result.hash_sha256}
              copyable
              onCopy={handleCopy}
              copied={copiedField === 'hash'}
              field="hash"
              truncate
            />
            <ResultRow
              label="Link de Verificação"
              value={result.certificate_url}
              link
            />
            <ResultRow
              label="Emitido em"
              value={new Date(result.timestamp).toLocaleString('pt-MZ')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.08] transition-colors"
            >
              Emitir Outro
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
            >
              Ver Documentos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultRow = ({ label, value, copyable, onCopy, copied, truncate, link, field }) => (
  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/[0.02]">
    <span className="text-xs text-slate-500 shrink-0">{label}</span>
    <div className="flex items-center gap-2 min-w-0">
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:text-cyan-300 truncate flex items-center gap-1"
        >
          {truncate ? value?.substring(0, 24) + '...' : value}
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      ) : (
        <span className="text-sm text-slate-300 truncate font-mono">
          {truncate ? value?.substring(0, 24) + '...' : value}
        </span>
      )}
      {copyable && (
        <button
          onClick={() => onCopy(value, field)}
          className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
          title="Copiar"
        >
          {copied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      )}
    </div>
  </div>
);

export default EmitPage;
