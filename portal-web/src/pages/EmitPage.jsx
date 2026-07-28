import React, { useState, useContext, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { hashFile } from '../utils/crypto';
import {
  FileCheck, Upload, Loader2, FileText, Hash, QrCode,
  X, Copy, Check, AlertTriangle, Building2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const EmitPage = () => {
  const { user, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [previewHash, setPreviewHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    try {
      const hash = await hashFile(selected);
      setPreviewHash(hash);
    } catch {
      notify('Erro ao calcular hash do ficheiro', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !docType.trim()) {
      notify('Preencha o tipo de documento e seleccione um ficheiro', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType.trim());
    if (isInstitution && institutionId) {
      formData.append('institution_id', institutionId);
    }

    try {
      setLoading(true);
      const { data } = await endpoints.certify.single(formData);
      setResult(data);
      notify('Documento emitido com sucesso', 'success');
      setFile(null);
      setDocType('');
      setPreviewHash('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      notify(err.normalizedMessage || 'Erro na emissão', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const docTypes = [
    'Certidão de Nascimento',
    'Certidão de Casamento',
    'Certidão de Óbito',
    'Diploma',
    'Certificado',
    'Declaração',
    'Outro',
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Emitir Documento</h1>
        <p className="text-xs text-slate-500">Certificação com hash SHA-256 e QR Code</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de documento */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo de Documento</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm appearance-none"
            required
          >
            <option value="" disabled className="bg-slate-900">Seleccionar tipo...</option>
            {docTypes.map((t) => (
              <option key={t} value={t} className="bg-slate-900">{t}</option>
            ))}
          </select>
        </div>

        {/* Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ficheiro PDF</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-cyan-400 mx-auto" />
                <p className="text-sm text-slate-200 font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewHash('');
                    setResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" /> Remover
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Clique para seleccionar ou arraste um PDF</p>
                <p className="text-xs text-slate-600">Máx. 10 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Hash */}
        {previewHash && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Hash className="w-3 h-3" /> Hash SHA-256 (pré-visualização)
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-cyan-400 break-all">{previewHash}</code>
              <button type="button" onClick={() => handleCopy(previewHash)} className="text-slate-500 hover:text-slate-300">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file || !docType}
          className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
          {loading ? 'A emitir...' : 'Emitir Documento'}
        </button>
      </form>

      {/* Resultado */}
      {result && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-400">Emissão Concluída</h3>
              <p className="text-xs text-slate-500">Documento certificado na blockchain</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Doc ID</span>
              <p className="text-sm font-mono text-slate-100">{result.doc_id || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Hash SHA-256</span>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-cyan-400 truncate">{(result.hash_sha256 || result.hash || '').substring(0, 20)}...</p>
                <button onClick={() => handleCopy(result.hash_sha256 || result.hash)} className="text-slate-500 hover:text-slate-300">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Instituição</span>
              <p className="text-sm text-slate-100">{result.institution_id || institutionId || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Créditos Restantes</span>
              <p className="text-sm text-slate-100">{result.credits_remaining ?? user?.credits ?? '—'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white border border-white/[0.1]">
            <QRCodeSVG
              value={`${window.location.origin}/verify/${result.hash_sha256 || result.hash}`}
              size={100}
              level="H"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
            <div className="text-center sm:text-left space-y-1">
              <p className="text-sm font-medium text-slate-800">QR Code de Verificação</p>
              <p className="text-xs text-slate-500">Escaneie para validar a autenticidade do documento</p>
              <a
                href={`/verify/${result.hash_sha256 || result.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline"
              >
                <QrCode className="w-3 h-3" /> Abrir página de verificação
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmitPage;

