import React from 'react';
import { CheckCircle, XCircle, Shield, Hash, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const EmitResult = ({ data }) => {
  if (!data) return null;
  return (
    <div className="glass-panel p-6 space-y-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-silver-light">Documento Emitido</h3>
          <p className="text-xs text-silver-dark">{data.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
            <Hash className="w-4 h-4 text-cyan mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-silver-dark mb-1">Hash SHA-256</p>
              <p className="text-xs font-mono text-silver break-all">{data.hash_sha256}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
            <Shield className="w-4 h-4 text-cyan mt-0.5" />
            <div>
              <p className="text-xs text-silver-dark mb-1">Doc ID</p>
              <p className="text-sm font-mono text-silver">{data.doc_id}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
            <Calendar className="w-4 h-4 text-cyan mt-0.5" />
            <div>
              <p className="text-xs text-silver-dark mb-1">Timestamp</p>
              <p className="text-sm text-silver">{new Date(data.timestamp).toLocaleString('pt-MZ')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white">
          <QRCodeSVG value={data.certificate_url || data.qr_code} size={160} level="H" />
          <p className="mt-3 text-xs text-tn-900 font-medium">Escaneie para verificar</p>
        </div>
      </div>

      {data.certificate_url && (
        <a 
          href={data.certificate_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary w-full flex items-center justify-center gap-2 mt-2"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Certificado
        </a>
      )}
    </div>
  );
};

export const VerifyResult = ({ data }) => {
  if (!data) return null;
  const d = data.dados_publicos;
  const isValid = data.status === 'valid' || data.status === 'VERIFIED';

  return (
    <div className={`glass-panel p-6 space-y-4 animate-slide-up border-l-4 ${isValid ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isValid ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
          {isValid ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-silver-light">
            {isValid ? 'Documento Válido' : 'Documento Inválido'}
          </h3>
          <p className="text-sm text-silver-dark">Status: <span className="text-cyan font-medium">{data.status}</span></p>
        </div>
      </div>

      {d && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
              <Shield className="w-4 h-4 text-cyan mt-0.5" />
              <div>
                <p className="text-xs text-silver-dark mb-1">Doc ID</p>
                <p className="text-sm font-mono text-silver">{d.doc_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
              <Building2 className="w-4 h-4 text-cyan mt-0.5" />
              <div>
                <p className="text-xs text-silver-dark mb-1">Instituição</p>
                <p className="text-sm text-silver">{d.institution_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-tn-800/50">
              <Calendar className="w-4 h-4 text-cyan mt-0.5" />
              <div>
                <p className="text-xs text-silver-dark mb-1">Emitido em</p>
                <p className="text-sm text-silver">{new Date(d.created_at).toLocaleString('pt-MZ')}</p>
              </div>
            </div>
            {d.revoked && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-xs text-red-400 mb-1">Revogado em</p>
                  <p className="text-sm text-red-300">{d.revoked_at ? new Date(d.revoked_at).toLocaleString('pt-MZ') : 'Data desconhecida'}</p>
                  {d.revoked_reason && <p className="text-xs text-red-300/70 mt-1">Motivo: {d.revoked_reason}</p>}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-tn-800/30">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isValid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {isValid ? <Shield className="w-12 h-12 text-emerald-400" /> : <XCircle className="w-12 h-12 text-red-400" />}
            </div>
            <p className="mt-4 text-sm font-medium text-silver">
              {isValid ? 'Autenticidade confirmada' : 'Autenticidade rejeitada'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

