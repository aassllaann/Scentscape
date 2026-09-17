'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store';

export default function AtlasSelection({ family }: { family: string | null }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch({ type: 'SET_PERFUME', payload: null });
    dispatch({ type: 'SET_FAMILY', payload: family });
  }, [dispatch, family]);

  return null;
}
