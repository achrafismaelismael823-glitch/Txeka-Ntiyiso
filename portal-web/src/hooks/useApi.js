import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export function useApi(options = {}) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operação realizada com sucesso',
    errorMessage = 'Erro ao processar a solicitação',
    retryCount = 0,
    retryDelay = 1000,
    cache = false,
    cacheTime = 5 * 60 * 1000,
    debounceMs = 0,
  } = options;

  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const invalidateCache = useCallback((key) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  const execute = useCallback(async (apiCall, opts = {}) => {
    const {
      onSuccess,
      onError,
      onFinally,
      customSuccessMessage,
      customErrorMessage,
      skipCache = false,
      cacheKey,
      signal: externalSignal,
    } = opts;

    const runApiCall = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      let signal = abortControllerRef.current.signal;
      if (externalSignal) {
        if (externalSignal.aborted) {
          return { data: null, error: null, success: false, aborted: true };
        }
        const abortHandler = () => abortControllerRef.current?.abort();
        externalSignal.addEventListener('abort', abortHandler);
        signal = abortControllerRef.current.signal;
      }

      setLoading(true);
      setError(null);

      try {
        const key = cacheKey || apiCall.toString();
        if (cache && !skipCache) {
          const cached = cacheRef.current.get(key);
          if (cached && Date.now() - cached.timestamp < cacheTime) {
            setData(cached.data);
            setLoading(false);
            onSuccess?.(cached.data);
            if (showSuccessToast) {
              notify(customSuccessMessage || successMessage, 'success');
            }
            return { data: cached.data, error: null, success: true };
          }
        }

        const result = await apiCall(signal);
        const responseData = result.data ?? result;

        setData(responseData);
        retryCountRef.current = 0;

        if (cache) {
          cacheRef.current.set(key, {
            data: responseData,
            timestamp: Date.now(),
          });
        }

        if (showSuccessToast) {
          notify(customSuccessMessage || successMessage, 'success');
        }

        onSuccess?.(responseData);
        return { data: responseData, error: null, success: true };

      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          return { data: null, error: null, success: false, aborted: true };
        }

        const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || customErrorMessage || errorMessage;
        setError(errorMsg);

        if (retryCountRef.current < retryCount && !err.response?.status?.toString().startsWith('4')) {
          retryCountRef.current++;
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
          await new Promise(r => setTimeout(r, delay));
          return runApiCall();
        }

        retryCountRef.current = 0;

        if (showErrorToast && err.response?.status !== 401) {
          notify(errorMsg, 'error');
        }

        onError?.(err);
        return { data: null, error: err, success: false };
      } finally {
        setLoading(false);
        onFinally?.();
      }
    };

    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          const result = await runApiCall();
          resolve(result);
        }, debounceMs);
      });
    }

    return runApiCall();
  }, [cache, cacheTime, debounceMs, notify, retryCount, retryDelay, showErrorToast, showSuccessToast, successMessage, errorMessage]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    retryCountRef.current = 0;
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    clearCache,
    invalidateCache,
    isLoading: loading,
    isError: !!error,
    isSuccess: !!data && !error,
  };
}

export function useQuery(apiCall, deps = [], options = {}) {
  const { enabled = true, refetchInterval = 0, ...apiOptions } = options;
  const api = useApi({ showErrorToast: true, ...apiOptions });

  useEffect(() => {
    if (!enabled) return;
    api.execute(apiCall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const interval = setInterval(() => {
      api.execute(apiCall, { skipCache: true });
    }, refetchInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchInterval, ...deps]);

  return api;
}

export function useMutation(options = {}) {
  return useApi({ showSuccessToast: true, showErrorToast: true, ...options });
}

export default useApi;
