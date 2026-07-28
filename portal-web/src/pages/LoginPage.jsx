import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { endpoints } from '../services/api';
import {
  ShieldCheck, Building2, User, Eye, EyeOff, Loader2,
  Wifi, WifiOff, AlertTriangle, Server
} from 'lucide-react';

const LoginPage = () => {
  const { login, adminLogin } = useContext(AuthContext);
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('institution');
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [diag, setDiag] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [apiHealthDetail, setApiHealthDetail] = useState(null);

  const testApiConnection = async () => {
    setApiHealth('checking');
    setApiHealthDetail(null);
    setDiag(null);
    try {
      const res = await endpoints.health.check();
      const text = await res.text().catch(() => '');
      setApiHealth('ok');
      setApiHealthDetail({ status: res.status, body: text });
      notify('API está online!', 'success');
    } catch (err) {
      setApiHealth('fail');
      setApiHealthDetail({ error: err.message });
      notify('API não responde', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDiag(null);

    try {
      if (mode === 'institution') {
        await login(institutionId.trim(), password);
        notify('Sessão iniciada com sucesso', 'success');
      } else {
        await adminLogin(email.trim(), password);
        notify('Sessão de administrador iniciada', 'success');
      }
      navigate(from, { replace: true });
    } catch (err) {
      const info = {
        message: err.normalizedMessage || err.message || 'Erro desconhecido',
        status: err.response?.status || err.apiStatus || 'NO_RESPONSE',
        statusText: err.response?.statusText || '',
        url: err.config?.url || err.apiUrl || 'NO_URL',
        fullUrl: err.config?.baseURL ? `${err.config.baseURL}${err.config.url}` : (err.apiBaseURL ? `${err.apiBaseURL}${err.apiUrl}` : (err.apiUrl || 'NO_URL')),
        method: err.config?.method?.toUpperCase() || 'POST',
        requestData: mode === 'institution'
          ? { institution_id: institutionId.trim(), password: '***' }
          : { email: email.trim(), password: '***' },
        responseData: err.response?.data || err.apiResponse || null,
        isNetworkError: !err.response && !err.apiResponse,
      };
      setDiag(info);
      notify(info.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Txeka Ntiyiso</h1>
            <p className="text-sm text-slate-500">Plataforma de Certificação Blockchain</p>
          </div>
        </div>

        <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('institution'); setDiag(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'institution'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" /> Instituição
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setDiag(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'admin'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" /> Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {mode === 'institution' ? 'ID da Instituição' : 'Email'}
            </label>
            <div className="relative">
              {mode === 'institution' ? (
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              ) : (
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              )}
              <input
                type={mode === 'institution' ? 'text' : 'email'}
                value={mode === 'institution' ? institutionId : email}
                onChange={(e) =>
                  mode === 'institution'
                    ? setInstitutionId(e.target.value)
                    : setEmail(e.target.value)
                }
                placeholder={mode === 'institution' ? 'Ex: CFN, ISTN' : 'admin@txeka.co.mz'}
                className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Palavra-passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={testApiConnection}
          disabled={apiHealth === 'checking'}
          className="w-full py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all flex items-center justify-center gap-2"
        >
          {apiHealth === 'checking' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : apiHealth === 'ok' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : apiHealth === 'fail' ? (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Server className="w-3.5 h-3.5" />
          )}
          {apiHealth === 'checking'
            ? 'A testar...'
            : apiHealth === 'ok'
            ? 'API Online ✓'
            : apiHealth === 'fail'
            ? 'API Offline ✗'
            : 'Testar Ligação à API'}
        </button>

        {apiHealthDetail && (
          <div className={`rounded-xl border p-3 text-xs font-mono space-y-1 ${
            apiHealth === 'ok'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}>
            {apiHealthDetail.status && <p><span className="text-slate-500">Status:</span> {apiHealthDetail.status}</p>}
            {apiHealthDetail.body && <p><span className="text-slate-500">Resposta:</span> {apiHealthDetail.body.substring(0, 200)}{apiHealthDetail.body.length > 200 ? '...' : ''}</p>}
            {apiHealthDetail.error && <p><span className="text-slate-500">Erro:</span> {apiHealthDetail.error}</p>}
          </div>
        )}

        {diag && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Diagnóstico do Erro
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <p><span className="text-slate-500">Mensagem:</span> <span className="text-red-300">{diag.message}</span></p>
              <p><span className="text-slate-500">Status HTTP:</span> <span className={typeof diag.status === 'number' && diag.status >= 400 ? 'text-red-400' : 'text-emerald-400'}>{diag.status} {diag.statusText}</span></p>
              <p><span className="text-slate-500">Método:</span> <span className="text-cyan-400">{diag.method}</span></p>
              <p><span className="text-slate-500">URL:</span> <span className="text-cyan-400 break-all">{diag.fullUrl}</span></p>
              {diag.isNetworkError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                  <p className="font-bold">Erro de Rede / CORS</p>
                  <p className="text-[0.65rem]">O browser bloqueou a requisição antes de chegar à API.</p>
                </div>
              )}
              {diag.requestData && (
                <div>
                  <p className="text-slate-500 mb-0.5">Request Body:</p>
                  <pre className="bg-black/30 rounded-lg p-2 text-[0.65rem] text-emerald-400 overflow-x-auto">{JSON.stringify(diag.requestData, null, 2)}</pre>
                </div>
              )}
              {diag.responseData && (
                <div>
                  <p className="text-slate-500 mb-0.5">Response Body:</p>
                  <pre className="bg-black/30 rounded-lg p-2 text-[0.65rem] text-amber-400 overflow-x-auto">{typeof diag.responseData === 'string' ? diag.responseData : JSON.stringify(diag.responseData, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600">
          {mode === 'institution'
            ? 'Utilize as credenciais fornecidas pelo administrador'
            : 'Acesso restrito à equipa de gestão'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

