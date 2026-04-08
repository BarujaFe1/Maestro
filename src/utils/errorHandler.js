import { logDebug, logError, logWarn, installConsoleCapture } from './logger';

export function installGlobalErrorHandlers() {
  try {
    installConsoleCapture();
    logDebug('installGlobalErrorHandlers.start');

    const ErrorUtilsRef = global?.ErrorUtils;
    if (ErrorUtilsRef?.getGlobalHandler && ErrorUtilsRef?.setGlobalHandler) {
      const defaultHandler = ErrorUtilsRef.getGlobalHandler();
      ErrorUtilsRef.setGlobalHandler((error, isFatal) => {
        logError('JS Fatal Error', error, { isFatal: !!isFatal });
        if (defaultHandler) defaultHandler(error, isFatal);
      });
    } else {
      logWarn('ErrorUtils não disponível: handler global pode não capturar tudo.');
    }

    if (typeof globalThis !== 'undefined' && 'onunhandledrejection' in globalThis) {
      globalThis.onunhandledrejection = (event) => {
        const reason = event?.reason;
        logError('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)), {
          rawReason: reason ? String(reason) : null
        });
      };
    }
  } catch (e) {
    logWarn('Falha ao instalar handlers globais', { message: e?.message || String(e) });
  }
}
