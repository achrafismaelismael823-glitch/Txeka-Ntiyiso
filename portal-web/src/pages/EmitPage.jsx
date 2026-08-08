import React, { useState, useContext, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileCheck, Upload, Loader2, FileText, X, Check, AlertTriangle,
  ChevronRight, ChevronLeft, Lock, ShieldCheck, QrCode, Copy, Check as CheckIcon
} from 'lucide-react';

const STEP_LABELS = ['Selecção', 'Confirmação', 'Resultado'];

const EmitPage = () => {
  const { user, isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      notify('Apenas ficheiros PDF são aceites', 'error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      notify('Ficheiro excede 10 MB', 'error');
      return;
    }
    setFile(f);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!file || !docType.trim()) {
      notify('Seleccione o tipo de documento e o ficheiro PDF', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const queryParams = {
      document_type: docType.trim(),
    };

    // NINGUÉM envia institution_id — backend infere do JWT para todos







    try {
      setLoading(true);
      const { data } = await endpoints.emissions.certify(formData, new URLSearchParams(queryParams).toString());
      setResult(data);
      notify('Documento certificado com sucesso', 'success');
      setStep(2);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro na certificação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setFile(null);
    setDocType('');
    setResult(null);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canProceed = file && docType.trim();

  /* ── STEP 0: SELECÇÃO ── */
  const StepSelect = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo de Documento</label>
        <input
          type="text"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          placeholder="Ex: CERTIFICADO, DUAT, ATESTADO..."
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
          required
        />
      </div>

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
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">{file ? file.name : 'Clique para seleccionar PDF'}</p>
            <p className="text-xs text-slate-600">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Máx. 10 MB • Apenas PDF'}</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/90">
            Modo Admin: pode emitir documentos em nome de outras instituições seleccionando o ID no campo acima.
          </p>
        </div>
      )}

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
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confirme a certificação
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Tipo de Documento</span>
            <p className="text-sm text-slate-100">{docType}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Ficheiro</span>
            <p className="text-sm text-slate-100">{file?.name}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Instituição Emissora</span>
            <p className="text-sm font-mono text-cyan-400">
              {isAdmin 
                ? (user?.institution || institutionId || '—') 
                : (user?.institution || institutionId || '—')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Tamanho</span>
            <p className="text-sm text-slate-100">{(file?.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/90">
            Será registada a <strong>impressão digital criptográfica (SHA-256)</strong> do documento. 
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck className="w-4 h-4" /> Certificar Documento</>}
        </button>
      </div>
    </div>
  );

  /* ── STEP 2: RESULTADO ── */
  const StepResult = () => {
    if (!result) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 space-y-5">
          {/* Selo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Documento Certificado</h3>
              <p className="text-xs text-slate-500">{result.message}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Doc ID</span>
              <p className="text-sm font-mono text-cyan-400">{result.doc_id}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Timestamp</span>
              <p className="text-sm text-slate-100">{new Date(result.timestamp).toLocaleString('pt-MZ')}</p>
            </div>
          </div>

          {/* Hash */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] text-slate-500 uppercase">Hash SHA-256</span>
              <button onClick={() => handleCopy(result.hash_sha256)} className="text-slate-500 hover:text-slate-300">
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-cyan-400 break-all">{result.hash_sha256}</code>
          </div>

          {/* QR Code */}
          {result.qr_code && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-center">
              <span className="text-[0.6rem] text-slate-500 uppercase">QR Code de Verificação</span>
              <img src={result.qr_code} alt="QR Code" className="w-32 h-32 mx-auto" />
              <p className="text-[0.6rem] text-slate-600">Escaneie para verificar a autenticidade</p>
            </div>
          )}

          {/* Certificate URL */}
          {result.certificate_url && (
            <a
              href={result.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all text-sm font-medium"
            >
              <FileCheck className="w-4 h-4" /> Abrir Certificado Oficial
            </a>
          )}

          <button
            onClick={handleReset}
            className="w-full py-3 bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] text-slate-300 hover:text-cyan-400 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <FileCheck className="w-4 h-4" /> Certificar Outro Documento
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Certificar Documento</h1>
        <p className="text-xs text-slate-500 mt-1">Emita um documento com hash criptográfico SHA-256</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              i === step ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
              i < step ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              'bg-white/[0.02] text-slate-600 border border-white/[0.04]'
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

      {step === 0 && <StepSelect />}
      {step === 1 && <StepConfirm />}
      {step === 2 && <StepResult />}
    </div>
  );
};

export default EmitPage;
