import React, { useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileCheck, Upload, Loader2, FileText, QrCode,
  X, Copy, Check, AlertTriangle, ChevronRight,
  ChevronLeft, Eye, ShieldCheck, RefreshCw, Lock,
  Download, ExternalLink
} from 'lucide-react';

const docTypes = [
  'Certidão de Nascimento',
  'Certidão de Casamento',
  'Certidão de Óbito',
  'Diploma Académico',
  'Certificado de Habilitações',
  'Atestado Médico',
  'Bilhete de Identidade',
  'Passaporte',
  'Carta de Condução',
  'Outro',
];

const STEP_LABELS = ['Selecção', 'Confirmação', 'Resultado'];

/* ── DOMÍNIOS OFICIAIS (preparar para migração) ── */
// Hoje:  https://txeka-ntiyiso.onrender.com
// Futuro: https://www.txekantiyiso.co.mz
const VERIFY_BASE_URL = window.location.origin; // Fallback para o domínio actual
// Quando migrar para o domínio oficial, substituir por:
// const VERIFY_BASE_URL = 'https://www.txekantiyiso.co.mz';

const EmitPage = () => {
  const { user, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      notify('Apenas ficheiros PDF são aceites', 'error');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      notify('O ficheiro excede o limite de 10 MB', 'error');
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileChange(dropped);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleSubmit = async () => {
    if (!file || !docType.trim()) {
      notify('Preencha o tipo de documento e seleccione um ficheiro', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = {
      document_type: docType.trim(),
    };
    if (isInstitution && institutionId) {
      queryParams.institution_id = institutionId;
    }

    try {
      setLoading(true);
      const { data } = await endpoints.certify.single(formData, queryParams);
      setResult(data);
      notify('Documento certificado com sucesso', 'success');
      setStep(2);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao certificar documento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyUrl = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleReset = () => {
    setStep(0);
    setFile(null);
    setDocType('');
    setResult(null);
    setCopiedHash(false);
    setCopiedUrl(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canProceed = file && docType;

  /* ── STEP 0: SELECÇÃO ── */
  const StepSelect = () => (
    <div className="space-y-6 animate-fade-in">
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ficheiro PDF</label>
        <div
          ref={dropRef}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-cyan-500/50 bg-cyan-500/10'
              : file
              ? 'border-cyan-500/30 bg-cyan-500/5'
              : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
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
              <p className="text-xs text-slate-600">Máx. 10 MB • Apenas PDF</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => canProceed && setStep(1)}
          disabled={!canProceed}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center gap-2"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  /* ── STEP 1: CONFIRMAÇÃO ── */
  const StepConfirm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" /> Confirme os dados antes de certificar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Tipo de Documento</span>
            <p className="text-sm text-slate-100">{docType}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Ficheiro</span>
            <p className="text-sm text-slate-100">{file?.name}</p>
            <p className="text-xs text-slate-500">{(file?.size / 1024).toFixed(1)} KB</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Instituição Emissora</span>
            <p className="text-sm text-slate-100">{institutionId || user?.id || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Créditos Disponíveis</span>
            <p className="text-sm text-slate-100">{user?.credits ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/90">
            Após a confirmação, será registada a <strong>impressão digital criptográfica (SHA-256)</strong> do documento 
            para posterior verificação de integridade e autenticidade. 
            A plataforma <strong>não armazena o conteúdo do ficheiro</strong>, preservando a confidencialidade 
            documental (princípio de Conhecimento Zero).
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(0)}
          className="px-6 py-3 bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 rounded-xl transition-all text-sm font-medium flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck className="w-4 h-4" /> Confirmar Certificação</>}
        </button>
      </div>
    </div>
  );

  /* ── STEP 2: RESULTADO ── */
  const StepResult = () => {
    if (!result) return null;
    const hash = result.hash_sha256 || '';
    const docId = result.doc_id || '—';
    const qrCode = result.qr_code || '';
    const certificateUrl = result.certificate_url || '';
    
    // URL canónica de verificação — usa certificate_url da API se disponível,
    // senão constrói a partir do domínio actual + hash
    const verifyUrl = certificateUrl || `${VERIFY_BASE_URL}/verify/${hash}`;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 space-y-5">
          {/* Selo Visual */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Integridade Certificada</h3>
              <p className="text-xs text-slate-500">Hash SHA-256 registado • Pronto para verificação pública</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Check className="w-3 h-3" /> Hash SHA-256 Registado
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
              <Lock className="w-3 h-3" /> Conhecimento Zero
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <QrCode className="w-3 h-3" /> Verificação Pública
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Doc ID</span>
              <p className="text-sm font-mono text-slate-100">{docId}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Hash SHA-256 Oficial</span>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-cyan-400 truncate">{hash.substring(0, 24)}...</p>
                <button onClick={() => handleCopyHash(hash)} className="text-slate-500 hover:text-slate-300">
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Data da Certificação</span>
              <p className="text-sm text-slate-100">
                {result.timestamp ? new Date(result.timestamp).toLocaleString('pt-MZ') : '—'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Estado</span>
              <p className="text-sm text-emerald-400 font-medium">{result.status || 'Certificado'}</p>
            </div>
          </div>

          {/* URL de Verificação Canónica */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">URL de Verificação Oficial</span>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs font-mono text-cyan-400 truncate">{verifyUrl}</p>
              <button onClick={() => handleCopyUrl(verifyUrl)} className="text-slate-500 hover:text-slate-300">
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* QR Code da API */}
          {qrCode && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white border border-white/[0.1]">
              <img src={qrCode} alt="QR Code de verificação oficial" className="w-28 h-28 rounded-lg" />
              <div className="text-center sm:text-left space-y-2">
                <p className="text-sm font-medium text-slate-800">QR Code de Verificação Oficial</p>
                <p className="text-xs text-slate-500">Escaneie para aceder à página oficial de verificação</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 text-xs font-medium hover:bg-cyan-500/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir verificação
                  </a>
                  <a
                    href={qrCode}
                    download={`${docId || 'txeka-ntiyiso-qr'}.png`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
                  >
                    <Download className="w-3 h-3" /> Baixar QR
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem da API */}
          {result.message && (
            <p className="text-xs text-slate-500 text-center">{result.message}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/documents')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.06] transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Ver Documentos
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Certificar Outro
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Certificação Digital</h1>
        <p className="text-xs text-slate-500 mt-1">
          Emissão de certificados de integridade documental através de hashes criptográficos
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              i === step
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : i < step
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/[0.02] text-slate-600 border border-white/[0.04]'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${
                i === step ? 'bg-cyan-500/20 text-cyan-400' : i < step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] text-slate-600'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <ChevronRight className={`w-4 h-4 shrink-0 ${i < step ? 'text-emerald-400' : 'text-slate-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */
      {step === 0 && <StepSelect />}
      {step === 1 && <StepConfirm />}
      {step === 2 && <StepResult />}
    </div>
  );
};

export default EmitPage;

