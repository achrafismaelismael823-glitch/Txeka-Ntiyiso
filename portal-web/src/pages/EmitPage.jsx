// Emissão única: Drop/Pick PDF → Preview → SHA-256 no browser → Emitir → Resultado
// Pilar Retenção Zero: hash calculado localmente, PDF processado em memória volátil

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { emitDocument } from '../services/api';
import { calculateSHA256, fileToBase64 } from '../utils/crypto';
import {
  Upload,
  FileText,
  X,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  Download,
  Fingerprint
} from 'lucide-react';

export default function EmitPage() {
  const { institutionId } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docType, setDocType] = useState('DUAT');
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const docTypes = ['DUAT', 'CERTIDÃO', 'DIPLOMA', 'LICENÇA', 'CONTRATO', 'OUTRO'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Apenas ficheiros PDF são aceites.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Ficheiro excede 50MB.');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // SHA-256 no browser — Retenção Zero
    try {
      setLoading(true);
      const fileHash = await calculateSHA256(selectedFile);
      setHash(fileHash);
    } catch {
      setError('Erro ao calcular hash do ficheiro.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setHash('');
    setResult(null);
    setError(null);
  };

  const handleEmit = async () => {
    if (!file || !hash) return;
    setLoading(true);
    setError(null);
    try {
      const response = await emitDocument(file, docType, institutionId);
      setResult(response.data);
      // Guardar no localStorage para histórico rápido
      const history = JSON.parse(localStorage.getItem('emissionHistory') || '[]');
      history.unshift({ ...response.data, emitted_at: new Date().toISOString() });
      localStorage.setItem('emissionHistory', JSON.stringify(history.slice(0, 100)));
    } catch (err) {
      setError(err.userMessage || 'Erro ao emitir documento. Verifique os créditos disponíveis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#00D2C4]" /> Emitir Documento
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Upload de PDF → Hash SHA-256 local → Emissão criptográfica
        </p>
      </div>

      {/* Área de Upload */}
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#00D2C4] bg-[#00D2C4]/5 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0B192C] mb-1">
            Arraste o PDF ou clique para seleccionar
          </p>
          <p className="text-xs text-slate-400">Máximo 50MB • Apenas PDF</p>
        </div>
      )}

      {/* Preview + Form */}
      {file && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-[#0B192C] truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={handleRemove} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview iframe */}
          <div className="h-96 bg-slate-100">
            <iframe src={previewUrl} title="Preview" className="w-full h-full" />
          </div>

          {/* Configuração */}
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Tipo de Documento
              </label>
              <div className="flex flex-wrap gap-2">
                {docTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setDocType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition border-2 ${
                      docType === type
                        ? 'border-[#00D2C4] bg-[#00D2C4]/10 text-[#0B192C]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Hash Display */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" /> Hash SHA-256 (Local)
                </label>
                <button onClick={handleCopyHash} className="text-xs text-[#00D2C4] hover:text-[#0B192C] font-semibold flex items-center gap-1 transition">
                  {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-700 break-all bg-white p-3 rounded-lg border border-slate-200">
                {hash || <span className="text-slate-400 italic">A calcular hash...</span>}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                ⚡ Hash calculado no seu browser. O ficheiro original nunca é armazenado nos nossos servidores.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleEmit}
              disabled={loading || !hash}
              className="w-full bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#0B192C]/20"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> A processar...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Emitir Documento</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Documento Emitido com Sucesso</h3>
              <p className="text-sm text-emerald-700">Registo criptográfico criado em {new Date(result.timestamp).toLocaleString('pt-MZ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">ID do Documento</p>
              <p className="text-sm font-mono font-bold text-[#0B192C]">{result.doc_id}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Hash SHA-256</p>
              <p className="text-xs font-mono text-slate-700 break-all">{result.hash_sha256}</p>
            </div>
          </div>

          {result.qr_code && (
            <div className="bg-white rounded-xl p-6 border border-emerald-200 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" /> Código QR de Verificação
              </p>
              <img src={result.qr_code} alt="QR Code" className="mx-auto w-48 h-48 border-2 border-slate-200 rounded-xl p-2" />
              <a
                href={result.qr_code}
                download={`qr-${result.doc_id}.png`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#00D2C4] hover:bg-[#00b8b0] text-white text-sm font-bold rounded-lg transition"
              >
                <Download className="w-4 h-4" /> Download QR
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

