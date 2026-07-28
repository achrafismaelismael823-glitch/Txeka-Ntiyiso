import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2, XCircle, Hash, FileText, ExternalLink,
  Shield, Calendar, QrCode, Copy, Check
} from 'lucide-react';

const ResultsDisplay = ({ results, type = 'emit' }) => {
  const [copied, setCopied] = React.useState(false);

  if (!results) return null;

  const isBulk = type === 'bulk';
  // Normaliza a resposta: API retorna hash_sha256 ou hash
  const normalizeItem = (item) => ({
    ...item,
    hash: item.hash_sha256 || item.hash || item.doc_hash,
    docId: item.doc_id,
  });

  const success = isBulk
    ? (results.successful || []).map(normalizeItem)
    : results.hash_sha256 || results.hash
    ? [normalizeItem(results)]
    : [];

  const failed = isBulk ? (results.failed || []) : [];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {success.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400">
              {isBulk ? `${success.length} Sucesso(s)` : results.message || 'Documento Certificado'}
            </h3>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {success.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-4"
              >
                {/* QR Code + Certificado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-3">
                    {item.docId && (
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Doc ID</p>
                          <p className="text-sm font-mono text-slate-100">{item.docId}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Hash className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Hash SHA-256</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-cyan-400 break-all">{item.hash}</p>
                          <button
                            onClick={() => handleCopy(item.hash)}
                            className="p-1 rounded-md hover:bg-white/[0.05] text-slate-400 transition-colors shrink-0"
                            title="Copiar hash"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {item.timestamp && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Timestamp</p>
                          <p className="text-xs text-slate-300">
                            {new Date(item.timestamp).toLocaleString('pt-MZ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.certificate_url && (
                      <a
                        href={item.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir Certificado Público
                      </a>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-white/[0.1]">
                    {item.qr_code ? (
                      item.qr_code.startsWith('data:') ? (
                        <img
                          src={item.qr_code}
                          alt="QR Code"
                          className="w-32 h-32 object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value={item.qr_code}
                          size={128}
                          level="H"
                          bgColor="#ffffff"
                          fgColor="#0f172a"
                        />
                      )
                    ) : item.certificate_url ? (
                      <QRCodeSVG
                        value={item.certificate_url}
                        size={128}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    ) : (
                      <QrCode className="w-16 h-16 text-slate-300" />
                    )}
                    <p className="mt-2 text-[0.6rem] text-slate-500 font-medium">Escaneie para verificar</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.03]">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {item.document_type || 'Documento Certificado'}
                  </span>
                  <button
                    onClick={() => window.open(`/verify/${item.hash}`, '_blank')}
                    className="ml-auto text-[0.65rem] text-cyan-400 hover:underline"
                  >
                    Verificar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold text-red-400">
              {isBulk ? `${failed.length} Falha(s)` : 'Erro na Emissão'}
            </h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {failed.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
              >
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">
                    {item.document_type || item.filename || 'Documento'}
                  </p>
                  <p className="text-[0.65rem] text-red-400/70 mt-0.5">
                    {item.error || item.detail || 'Erro desconhecido'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;

