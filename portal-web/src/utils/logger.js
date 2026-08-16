const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 };
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
const isDev = process.env.NODE_ENV !== 'production';

class Logger {
  constructor(prefix = 'Txeka') {
    this.prefix = prefix;
  }

  _log(level, message, ...args) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.prefix}] [${level}]`;
    if (isDev) {
      const colors = { DEBUG: 'color: #94a3b8', INFO: 'color: #06b6d4', WARN: 'color: #f59e0b', ERROR: 'color: #ef4444' };
      console.log(`%c${prefix}`, colors[level], message, ...args);
    } else {
      if (typeof window !== 'undefined' && window.gtag && level === 'ERROR') {
        window.gtag('event', 'exception', { description: `${prefix}: ${message}`, fatal: false });
      }
      console[level.toLowerCase()]?.(prefix, message, ...args);
    }
  }

  debug(message, ...args) { this._log('DEBUG', message, ...args); }
  info(message, ...args) { this._log('INFO', message, ...args); }
  warn(message, ...args) { this._log('WARN', message, ...args); }
  error(message, ...args) { this._log('ERROR', message, ...args); }
  action(action, details = {}) { this.info(`[ACTION] ${action}`, details); }
  api(method, endpoint, status, duration) { this.debug(`[API] ${method.toUpperCase()} ${endpoint} → ${status} (${duration}ms)`); }
  perf(label, startTime) { const duration = performance.now() - startTime; this.debug(`[PERF] ${label}: ${duration.toFixed(2)}ms`); }
}

export const logger = new Logger('Txeka');
export const createLogger = (module) => new Logger(module);
export default logger;

