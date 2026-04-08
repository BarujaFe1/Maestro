import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const KEY = 'maestro_theme_mode';

const light = {
  mode: 'light',
  colors: {
    bg: '#f4f6fb',
    card: '#ffffff',
    surfaceMuted: '#f8fafc',
    surfaceSoft: '#eef2f8',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#475569',
    textSoft: '#64748b',
    inputBg: '#ffffff',
    inputText: '#0f172a',
    placeholder: '#94a3b8',
    accent: '#1d4ed8',
    accentSoft: '#dbeafe',
    danger: '#dc2626',
    dangerSoft: '#fee2e2',
    success: '#16a34a',
    successSoft: '#dcfce7',
    warning: '#d97706',
    warningSoft: '#fef3c7',
    chipBg: '#e0e7ff',
    chipText: '#1e3a8a',
    shadow: 'rgba(15, 23, 42, 0.08)',
  },
};

const dark = {
  mode: 'dark',
  colors: {
    bg: '#0b1220',
    card: '#111827',
    surfaceMuted: '#0f172a',
    surfaceSoft: '#111c2f',
    border: '#1f2937',
    borderStrong: '#334155',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    textSoft: '#64748b',
    inputBg: '#0f172a',
    inputText: '#e5e7eb',
    placeholder: '#64748b',
    accent: '#3b82f6',
    accentSoft: '#172554',
    danger: '#f87171',
    dangerSoft: '#3f1d1d',
    success: '#22c55e',
    successSoft: '#14532d',
    warning: '#f59e0b',
    warningSoft: '#78350f',
    chipBg: '#1f2a44',
    chipText: '#c7d2fe',
    shadow: 'rgba(2, 6, 23, 0.35)',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setMode] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'dark' || v === 'light' || v === 'system') setMode(v);
    });
  }, []);

  const theme = useMemo(() => {
    const effective = mode === 'system' ? system : mode;
    return effective === 'dark' ? dark : light;
  }, [mode, system]);

  const value = useMemo(() => ({
    mode,
    setMode: async (m) => {
      setMode(m);
      await AsyncStorage.setItem(KEY, m);
    },
    theme,
  }), [mode, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
