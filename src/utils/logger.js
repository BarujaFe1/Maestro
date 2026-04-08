import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const KEY = 'gem_logs_v3';
const MAX = 1200;
const SUPPRESSED_MESSAGES = ['Invalid Refresh Token: Already Used'];

const nativeConsole = {
  log: console.log.bind(console),
  info: (console.info || console.log).bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

let consoleCaptureInstalled = false;
let consoleCaptureBusy = false;

function safeJson(obj) {
  try { return JSON.stringify(obj); } catch { return String(obj); }
}

async function readAll() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function writeAll(list) {
  const trimmed = list.slice(-MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

async function persistEntry(entry) {
  const list = await readAll();
  list.push(entry);
  await writeAll(list);
}

function shouldSuppress(message) {
  return SUPPRESSED_MESSAGES.some((part) => String(message || '').includes(part));
}

export async function getLogs() {
  if (!__DEV__) return [];
  return readAll();
}

export async function clearLogs() {
  if (!__DEV__) return;
  await AsyncStorage.removeItem(KEY);
}

export async function logEvent(level, message, meta) {
  const suppressed = shouldSuppress(message) || shouldSuppress(meta?.errorMessage);
  const finalLevel = suppressed && level === 'ERROR' ? 'WARN' : level;
  const entry = { ts: new Date().toISOString(), level: finalLevel, message, meta: meta ?? null };
  const line = `[${entry.ts}] [${finalLevel}] ${message} ${meta ? safeJson(meta) : ''}`;

  if (__DEV__) {
    if (finalLevel === 'ERROR') nativeConsole.error(line);
    else if (finalLevel === 'WARN') nativeConsole.warn(line);
    else if (finalLevel === 'INFO') nativeConsole.info(line);
    else nativeConsole.log(line);
    await persistEntry(entry);
  }

  return entry;
}

export async function logInfo(message, meta) { return logEvent('INFO', message, meta); }
export async function logWarn(message, meta) { return logEvent('WARN', message, meta); }
export async function logDebug(message, meta) { return logEvent('DEBUG', message, meta); }
export async function logError(message, error, meta) {
  const payload = { ...(meta || {}), errorMessage: error?.message || String(error), errorStack: error?.stack || null };
  return logEvent('ERROR', message, payload);
}

export function installConsoleCapture() {
  if (!__DEV__) return;
  if (consoleCaptureInstalled) return;
  consoleCaptureInstalled = true;

  const capture = (level, original) => (...args) => {
    original(...args);
    if (consoleCaptureBusy) return;
    consoleCaptureBusy = true;
    Promise.resolve().then(async () => {
      try {
        const rendered = args.map((item) => {
          if (typeof item === 'string') return item;
          try { return JSON.stringify(item); } catch { return String(item); }
        }).join(' ').slice(0, 4000);

        const suppressed = shouldSuppress(rendered);
        const finalLevel = suppressed && level === 'ERROR' ? 'WARN' : level;

        await persistEntry({ ts: new Date().toISOString(), level: finalLevel, message: `console.${level.toLowerCase()}`, meta: { args: rendered } });
      } catch {
        // noop
      } finally {
        consoleCaptureBusy = false;
      }
    });
  };

  console.log = capture('LOG', nativeConsole.log);
  console.info = capture('INFO', nativeConsole.info);
  console.warn = capture('WARN', nativeConsole.warn);
  console.error = capture('ERROR', nativeConsole.error);
  nativeConsole.info('[Maestro] console capture enabled');
}

export async function exportLogsTxt() {
  if (!__DEV__) return null;
  const logs = await readAll();
  const content = logs.map((l) => `${l.ts} [${l.level}] ${l.message} ${l.meta ? safeJson(l.meta) : ''}`).join('\n');
  const uri = `${FileSystem.cacheDirectory}gem-logs.txt`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) await Sharing.shareAsync(uri, { mimeType: 'text/plain' });
  return uri;
}
