'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Perfume } from './types';

interface AppState {
  selectedPerfume: Perfume | null;
  selectedFamily: string | null;
  timelineProgress: number;
}

type Action =
  | { type: 'SET_PERFUME'; payload: Perfume | null }
  | { type: 'SET_FAMILY'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number };

const initialState: AppState = {
  selectedPerfume: null,
  selectedFamily: null,
  timelineProgress: 0,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PERFUME':
      return { ...state, selectedPerfume: action.payload, timelineProgress: 0 };
    case 'SET_FAMILY':
      return { ...state, selectedFamily: action.payload };
    case 'SET_PROGRESS':
      return { ...state, timelineProgress: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function useSelectedPerfume() {
  return useAppContext().state.selectedPerfume;
}

export function useSelectedFamily() {
  return useAppContext().state.selectedFamily;
}

export function useTimelineProgress() {
  return useAppContext().state.timelineProgress;
}

export function useAppDispatch() {
  return useAppContext().dispatch;
}
