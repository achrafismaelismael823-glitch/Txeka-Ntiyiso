import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { endpoints } from '../services/api';
import { authService } from '../services/authService';
import {
  ShieldCheck, Building2, User, Eye, EyeOff, Loader2,
  WifiOff, Server, CheckCircle2, Lock, Timer
} from 'lucide-react';

const LoginPage = () => {
  const { login, adminLogin } = useContext(AuthContext);
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize the destination after login. Default to root ("/") which
  // matches App.js where the dashboard is mounted at path="/".
  const rawFrom = location.state?.from?.pathname;
  const from = rawFrom && rawFrom !== '/login' ? rawFrom : '/';

  const [mode, setMode] = useState('institution');
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(authService.getFailedAttempts());
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [apiHealth, setApiHealth] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const passwordTimerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = authService.getRemainingLockoutSeconds();
      setLockoutRemaining(remaining);
      if (remaining === 0 && failedAttempts > 0) {
        setFailedAttempts(authService.getFailedAttempts());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [failedAttempts]);

  useEffect(() => {
    if (showPassword) {
      passwordTimerRef.current = setTimeout(() => setShowPassword(false), 3000);
    }
    return () => { if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current); };
  }, [showPassword, password]);

  const testApiConnection = async () => {
    setApiHealth('checking');
    try {
      const res = await endpoints.health.check();
      setApiHealth(res.ok || res.status === 200 ? 'ok' : 'fail');
    } catch { setApiHealth('fail'); }
  };

  const getCooldownSeconds = (attempts) => {
    if (attempts >= 9) return 300;
    if (attempts >= 6) return 120;
    if (attempts >= 3) return 30;
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) { await new Promise(r => setTimeout(r, 1500)); notify('Credenciais inválidas', 'error'); return; }
    const locked = authService.isLockedOut();
    if (locked) { notify(`Muitas tentativas falhadas. Aguarde ${locked} segundos.`, 'error'); return; }
    if (!password) return;
    setLoading(true);

    try {
      const result = mode === 'institution'
        ? await login(institutionId.trim(), password)
        : await adminLogin(email.trim(), password);

      if (result.success) {
        authService.resetFailedAttempts();
        setFailedAttempts(0);
        const token = authService.getToken();
        if (!token) { notify('Erro interno: sessão não iniciada', 'error'); setLoading(false); return; }

        notify(mode === 'institution' ? 'Sessão iniciada com sucesso' : 'Sessão de administrador iniciada', 'success');

        setTimeout(() => {
          navigate(from, { replace: true });
          setTimeout(() => { if (window.location.pathname === '/login') window.location.href = from; }, 400);
        }, 150);
      } else {
        const attempts = authService.incrementFailedAttempts();
        setFailedAttempts(attempts);
        const cooldown = getCooldownSeconds(attempts);
        if (cooldown > 0) {
          authService.setLockout(cooldown);
          setLockoutRemaining(cooldown);
          notify(`Credenciais inválidas. Conta temporariamente bloqueada por ${cooldown} segundos.`, 'error');
        } else {
          notify('Credenciais inválidas. Verifique os dados e tente novamente.', 'error');
        }
      }
    } catch (err) {
      const attempts = authService.incrementFailedAttempts();
      setFailedAttempts(attempts);
      const cooldown = getCooldownSeconds(attempts);
      if (cooldown > 0) {
        authService.setLockout(cooldown);
        setLockoutRemaining(cooldown);
        notify(`Credenciais inválidas. Conta temporariamente bloqueada por ${cooldown} segundos.`, 'error');
      } else {
        notify('Credenciais inválidas. Verifique os dados e tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutRemaining > 0;
  const attemptsBeforeLockout = Math.max(0, 3 - (failedAttempts % 3));

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
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
          <button type="button" onClick={() => { if (!isLocked) setMode('institution'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'institution' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300'}`}>
            <Building2 className="w-4 h-4" /> Instituição
          </button>
          <button type="button" onClick={() => { if (!isLocked) setMode('admin'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300'}`}>
            <User className="w-4 h-4" /> Administrador
          </button>
        </div>

        {failedAttempts > 0 && !isLocked && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Tentativa {failedAttempts} falhada{failedAttempts > 1 ? 's' : ''}. {attemptsBeforeLockout} tentativa{attemptsBeforeLockout > 1 ? 's' : ''} antes do bloqueio temporário.</span>
          </div>
        )}

        {isLocked && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold">Conta temporariamente bloqueada.</span>
            <span className="ml-auto font-mono">{lockoutRemaining}s</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}>
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

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
                onChange={(e) => mode === 'institution' ? setInstitutionId(e.target.value) : setEmail(e.target.value)}
                placeholder={mode === 'institution' ? 'Ex: CFN, ISTN' : 'admin@txeka.co.mz'}
                className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
                disabled={isLocked}
                autoComplete={mode === 'institution' ? 'off' : 'username'}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Palavra-passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
                disabled={isLocked}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                title={showPassword ? 'Ocultar (auto-oculta em 3s)' : 'Mostrar'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {showPassword && <p className="text-[0.6rem] text-amber-400/70">Password visível — auto-oculta em 3 segundos</p>}
          </div>

          <button type="submit" disabled={loading || !password || isLocked}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLocked ? `Bloqueado (${lockoutRemaining}s)` : 'Entrar')}
          </button>
        </form>

        <div className="space-y-2">
          {apiHealth === 'ok' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /><span>Infraestrutura Disponível</span>
            </div>
          ) : apiHealth === 'fail' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-red-400">
              <WifiOff className="w-3.5 h-3.5" /><span>Serviço indisponível</span>
            </div>
          ) : (
            <button type="button" onClick={testApiConnection} disabled={apiHealth === 'checking'}
              className="w-full py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-500 hover:text-slate-300 hover:border-white/[0.1] transition-all flex items-center justify-center gap-2">
              {apiHealth === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              {apiHealth === 'checking' ? 'A verificar...' : 'Verificar disponibilidade'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">
          {mode === 'institution' ? 'Utilize as credenciais fornecidas pelo administrador' : 'Acesso restrito à equipa de gestão'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
