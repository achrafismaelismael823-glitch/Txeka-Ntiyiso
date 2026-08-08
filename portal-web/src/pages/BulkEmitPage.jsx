import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileStack, Loader2, AlertTriangle, CheckCircle2, XCircle,
  FileText, Download, Upload, ShieldCheck, RefreshCw, Lock,
  ChevronRight, ChevronLeft, ExternalLink, Copy, Check
} from 'lucide-react';

const STEP_LABELS = ['Configuração', 'Revisão', 'Resultado'];

const BulkEmitPage = () => {
  const { user, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);

  const [step, setStep] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const examplePayload = {
    institution_id: institutionId || 'SUA_INSTITUICAO',
    documents: [
      {
        document_type: 'CERTIFICADO',
        file_name: 'CERTIFICADO_Joao_Silva_2026.pdf',
        content: 'CERTIFICADO DE PARTICIPACAO | Centro de Formacao Ntiyiso | Nome: Joao Manuel Silva | BI: 123456789A | Curso: Programacao Python | Data: 05/07/2026 | Nota: 18/20'
      },
      {
        document_type: 'CERTIFICADO',
        file_name: 'CERTIFICADO_Maria_Santos_2026.pdf',
        content: 'CERTIFICADO DE PARTICIPACAO | Centro de Formacao Ntiyiso | Nome: Maria Fernanda Santos | BI: 987654321B | Curso: Programacao Python | Data: 05/07/2026 | Nota: 19/20'
      }
    ]
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(examplePayload, null, 2));
  };

  const clearInput = () => {
    setJsonInput('');
    setResults(null);
  };

  const parsedPayload = () => {
    try {
      return JSON.parse(jsonInput);
    } catch {
      return null;
    }
  };

  const isValid = () => {
    const p = parsedPayload();
    if (!p) return false;
    if (!p.institution_id) return false;
    if (!Array.isArray(p.documents) || p.documents.length === 0) return false;
    return p.documents.every(d => d.document_type && d.file_name && d.content);
  };

  const handleSubmit = async () => {
    const payload = parsedPayload();
    if (!payload) {
      notify('JSON inválido. Verifique a sintaxe', 'error');
      return;
    }

    try {
      setLoading(true);
      const { data } = await endpoints.certify.bulk(payload);
      setResults(data);
      notify(`${data.documents?.length || 0} documento(s) certificado(s) com sucesso`, 'success');
      setStep(2);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro na certificação em massa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep(0);
    setJsonInput('');
    setResults(null);
    setCopied(false);
  };

  /* ── STEP 0: CONFIGURAÇÃO ── */
  const StepConfig = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={loadExample}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 transition-all"
        >
          <FileText className="w-3.5 h-3.5" /> Carregar exemplo
        </button>
        <button
          type="button"
          onClick={clearInput}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-red-400 transition-all"
        >
          <XCircle className="w-3.5 h-3.5" /> Limpar
        </button>
      </div>

      <div className="relative">
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`{\n  "institution_id": "${institutionId || 'SUA_INSTITUICAO'}",\n  "documents": [\n    {\n      "document_type": "CERTIFICADO",\n      "file_name": "doc_1.pdf",\n      "content": "Conteúdo textual do documento..."\n    }\n  ]\n}`}
          className="w-full h-96 px-4 py-3 bg-black/20 border border-white/[0.06] rounded-2xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 text-xs font-mono resize-none"
          spellCheck={false}
        />
      </div>

      {jsonInput && !isValid() && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400/90">
            O JSON deve conter <code>institution_id</code> e um array <code>documents</code> onde cada item tem <code>document_type</code>, <code>file_name</code> e <code>content</code>.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => isValid() && setStep(1)}
          disabled={!isValid()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center gap-2"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  /* ── STEP 1: REVISÃO ── */
  const StepReview = () => {
    const payload = parsedPayload();
    if (!payload) return null;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confirme a certificação em massa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Instituição</span>
              <p className="text-sm font-mono text-cyan-400">{payload.institution_id}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Total de Documentos</span>
              <p className="text-sm text-slate-100">{payload.documents.length}</p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {payload.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate">{doc.file_name}</p>
                  <p className="text-[0.6rem] text-slate-500">{doc.document_type} • {doc.content.substring(0, 40)}...</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/90">
              Serão registadas as <strong>impressões digitais criptográficas (SHA-256)</strong> de todos os documentos. 
              A plataforma <strong>não armazena o conteúdo completo</strong>, preservando a confidencialidade 
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileStack className="w-4 h-4" /> Certificar {payload.documents.length} Documento(s)</>}
          </button>
        </div>
      </div>
    );
  };

  /* ── STEP 2: RESULTADO ── */
  const StepResult = () => {
    if (!results) return null;
    const docs = results.documents || [];
    const successCount = docs.length;
    const creditsRemaining = results.credits_remaining;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 space-y-5">
          {/* Selo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Certificação Concluída</h3>
              <p className="text-xs text-slate-500">{results.message || `${successCount} documento(s) certificado(s)`}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
              <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
              <p className="text-xs text-slate-500">Certificados</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-center">
              <p className="text-2xl font-bold text-cyan-400">{creditsRemaining ?? '—'}</p>
              <p className="text-xs text-slate-500">Créditos Restantes</p>
            </div>
          </div>

          {/* Results List */}
          {docs.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {docs.map((doc, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-mono text-slate-200">{doc.doc_id}</span>
                    </div>
                    <a
                      href={doc.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Verificar
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Hash SHA-256</span>
                    <code className="text-xs font-mono text-cyan-400 truncate">{doc.hash_sha256}</code>
                    <button onClick={() => handleCopy(doc.hash_sha256)} className="text-slate-500 hover:text-slate-300">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">URL</span>
                    <code className="text-xs font-mono text-slate-500 truncate">{doc.certificate_url}</code>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Certificar Mais
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Certificação em Massa</h1>
        <p className="text-xs text-slate-500 mt-1">Certifique múltiplos documentos via JSON — API B2B/B2G</p>
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

      {step === 0 && <StepConfig />}
      {step === 1 && <StepReview />}
      {step === 2 && <StepResult />}
    </div>
  );
};

export default BulkEmitPage;

