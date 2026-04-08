import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { UNIT_IDS } from '../constants/units';
import { getExpectedLessonType, getNextLessonSummary, getOperationalLessonStatus } from '../utils/calendarRules';

const KEY = 'maestro_operational_context_v4';
const OperationalContext = createContext(null);

export function OperationalProvider({ children }) {
  const [activeUnitId, setActiveUnitId] = useState(UNIT_IDS.CENTRAL);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedLessonType, setSelectedLessonType] = useState('');
  const [hasManualTypeOverride, setHasManualTypeOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) {
        const expected = getExpectedLessonType(UNIT_IDS.CENTRAL, dayjs()).expectedType;
        setSelectedLessonType(expected);
        setReady(true);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        const unitId = parsed.activeUnitId || UNIT_IDS.CENTRAL;
        const date = parsed.selectedDate || dayjs().format('YYYY-MM-DD');
        const expected = getExpectedLessonType(unitId, date).expectedType;
        setActiveUnitId(unitId);
        setSelectedDate(date);
        setSelectedLessonType(parsed.selectedLessonType || expected);
        setHasManualTypeOverride(!!parsed.hasManualTypeOverride);
        setOverrideReason(parsed.overrideReason || '');
      } catch {
        setSelectedLessonType(getExpectedLessonType(UNIT_IDS.CENTRAL, dayjs()).expectedType);
      } finally {
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify({
      activeUnitId,
      selectedDate,
      selectedLessonType,
      hasManualTypeOverride,
      overrideReason,
    }));
  }, [activeUnitId, selectedDate, selectedLessonType, hasManualTypeOverride, overrideReason, ready]);

  const expectedLessonType = useMemo(() => getExpectedLessonType(activeUnitId, selectedDate).expectedType, [activeUnitId, selectedDate]);

  const statusInfo = useMemo(() => getOperationalLessonStatus({
    unitId: activeUnitId,
    dateLike: selectedDate,
    selectedLessonType,
    hasManualTypeOverride,
  }), [activeUnitId, selectedDate, selectedLessonType, hasManualTypeOverride]);

  const nextLesson = useMemo(() => getNextLessonSummary(activeUnitId, selectedDate), [activeUnitId, selectedDate]);

  const value = useMemo(() => ({
    ready,
    activeUnitId,
    setActiveUnitId: (unitId) => {
      setActiveUnitId(unitId);
      if (!hasManualTypeOverride) setSelectedLessonType(getExpectedLessonType(unitId, selectedDate).expectedType);
    },
    selectedDate,
    setSelectedDate: (date) => {
      setSelectedDate(date);
      if (!hasManualTypeOverride) setSelectedLessonType(getExpectedLessonType(activeUnitId, date).expectedType);
    },
    selectedLessonType,
    setSelectedLessonType,
    hasManualTypeOverride,
    setHasManualTypeOverride,
    overrideReason,
    setOverrideReason,
    expectedLessonType,
    statusInfo,
    nextLesson,
    resetToExpectedType: () => {
      setSelectedLessonType(getExpectedLessonType(activeUnitId, selectedDate).expectedType);
      setHasManualTypeOverride(false);
      setOverrideReason('');
    },
  }), [
    ready,
    activeUnitId,
    selectedDate,
    selectedLessonType,
    hasManualTypeOverride,
    overrideReason,
    expectedLessonType,
    statusInfo,
    nextLesson,
  ]);

  return <OperationalContext.Provider value={value}>{children}</OperationalContext.Provider>;
}

export function useOperational() {
  const ctx = useContext(OperationalContext);
  if (!ctx) throw new Error('useOperational deve ser usado dentro de OperationalProvider');
  return ctx;
}
