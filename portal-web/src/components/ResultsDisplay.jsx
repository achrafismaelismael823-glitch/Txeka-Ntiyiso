// src/components/ResultsDisplay.jsx
import React, { useState } from 'react';
import { formatDate } from '../utils/validation';
import { CheckCircle, XCircle, AlertCircle, Copy, Check, Download, Printer, Share2 } from 'lucide-react';

// API returns: status = "VALID" | "INVALID" | "EXPIRED" | "REVOKED"
// dados_publicos: { doc_id, document_type, institution_id, created_at, revoked, revoked_at, revoked_reason }
function getStatusConfig(status) {
  const configs = {
    VALID: { label: 'Válido', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅' },
    INVALID: { label: 'Inválido', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: '❌' },
    EXPIRED: { label: 'Expirado', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⏰' },
    REVOKED: { label: 'Revogado', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: '🚫' },
  };
  return configs[status] || configs.INVALID;
}

export default function ResultsDisplay({ result, hash }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const statusConfig = getStatusConfig(result.status);
  const dados = result.dados_publicos;
  const isValid = result.status === 'VALID' && dados;
  const isRevoked = dados && dados.revoked === true;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!result.qr_code) return;
    const link = document.createElement('a');
    link.href = result.qr_code;
    link.download = `qr-code-${hash.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!result.qr_code) return;
    const printWindow = window.open('', '', 'width=600,height=700');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Code - Txeka Ntiyiso</title><style>body{font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;background:white;}.container{text-align:center;max-width:500px;}h1{color:#0B192C;margin-bottom:10px;}.doc-info{background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;text-align:left;}.info-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e0e0e0;}.info-row:last-child{border-bottom:none;}.qr-container{margin:20px 0;padding:20px;background:white;border:2px solid #00D2C4;border-radius:8px;}.qr-container img{max-width:300px;height:auto;}.footer{color:#666;font-size:12px;margin-top:20px;padding-top:20px;border-top:1px solid #ddd;}@media print{body{background:white;}}</style></head><body><div class="container"><h1>Txeka Ntiyiso</h1><h2>Comprovante de Verificação</h2><div class="doc-info"><div class="info-row"><strong>Documento:</strong><span>${dados?.doc_id || 'N/A'}</span></div><div class="info-row"><strong>Instituição:</strong><span>${dados?.institution_id || 'N/A'}</span></div><div class="info-row"><strong>Status:</strong><span>${isRevoked ? 'Revogado' : 'Válido'}</span></div><div class="info-row"><strong>Data:</strong><span>${formatDate(dados?.created_at)}</span></div></div><div class="qr-container"><p><strong>Código QR de Verificação</strong></p><img src="${result.qr_code}" alt="QR Code" /></div><div class="footer"><p>Escaneie este código QR para verificar a autenticidade do documento.</p><p>Hash: ${hash.substring(0, 16)}...</p><p>Txeka Ntiyiso - Verificação Digital de Documentos</p></div></div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareWhatsApp = () => {
    if (!result.qr_code) return;
    const text = encodeURIComponent(`Documento Verificado no Txeka Ntiyiso\n\nDocumento: ${dados?.doc_id}\nInstituição: ${dados?.institution_id}\nStatus: ${isRevoked ? 'Revogado' : 'Válido'}\n\nVerifique em: https://txeka-ntiyiso-portal.onrender.com`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?verify=${hash}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link de partilha copiado para clipboard!');
  };

  return (
    <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm mt-6 ${statusConfig.border} ${statusConfig.bg}`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="text-4xl flex-shrink-0">{statusConfig.icon}</div>
        <div className="flex-1">
          <h3 className={`text-2xl font-bold ${statusConfig.color}`}>
            {isValid ? 'Documento Autenticado' : `Documento ${statusConfig.label}`}
          </h3>
          <p className="text-slate-600 text-sm mt-1">
            {isValid
              ? 'O documento foi verificado com sucesso na base de dados de Txeka Ntiyiso'
              : `O documento com este hash esta ${statusConfig.label.toLowerCase()} no sistema`}
          </p>
        </div>
      </div>

      {isValid && result.qr_code && (
        <div className="mb-6 bg-white rounded-xl p-6 border-2 border-[#00D2C4]/30 text-center">
          <p className="text-slate-600 text-sm font-semibold mb-4">Código QR de Verificação</p>
          <img src={result.qr_code} alt="QR Code do Documento" className="mx-auto mb-4 w-48 h-48 border-2 border-slate-200 rounded-lg p-2 bg-white" />
          <p className="text-slate-500 text-xs mb-4">Escaneie o código QR para compartilhar esta verificação</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDownloadQR} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold">
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={handlePrintQR} className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
            <button onClick={handleShareWhatsApp} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold col-span-2">
              <Share2 className="h-4 w-4" /> Compartilhar WhatsApp
            </button>
          </div>
        </div>
      )}

      {isValid && dados && (
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-slate-500 text-xs font-semibold uppercase">ID do Documento</p>
            <p className="text-lg font-bold text-[#0B192C]">{dados.doc_id}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-slate-500 text-xs font-semibold uppercase">Tipo de Documento</p>
            <p className="text-slate-800 font-semibold">{dados.document_type}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-slate-500 text-xs font-semibold uppercase">Instituição</p>
            <p className="text-slate-800 font-semibold">{dados.institution_id}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <p className="text-slate-500 text-xs font-semibold uppercase">Data de Emissão</p>
              <p className="text-slate-800 font-semibold">{formatDate(dados.created_at)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <p className="text-slate-500 text-xs font-semibold uppercase">Status</p>
              <p className={`font-semibold ${isRevoked ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isRevoked ? '⚠️ Revogado' : '✓ Válido'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-500 text-xs font-semibold uppercase">Hash SHA-256</p>
          <button onClick={handleCopyHash} className="flex items-center gap-1 text-xs text-[#00D2C4] hover:text-[#0B192C] transition">
            {copied ? <><Check className="h-3 w-3" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
          </button>
        </div>
        <p className="font-mono text-xs text-slate-700 break-all">{hash}</p>
      </div>

      {isValid && (
        <button onClick={handleShareLink} className="mt-4 w-full bg-[#00D2C4] hover:bg-[#00b8b0] text-white py-2 rounded-xl transition font-semibold text-sm flex items-center justify-center gap-2">
          <Share2 className="h-4 w-4" /> Copiar Link de Partilha
        </button>
      )}

      {isValid && isRevoked && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 h-5 w-5" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Documento Revogado</p>
            <p className="text-sm text-amber-700">
              Este documento foi revogado e nao e mais válido.
              {dados.revoked_reason && <span className="block mt-1 font-medium">Motivo: {dados.revoked_reason}</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

