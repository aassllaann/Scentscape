'use client';

import { AnimatePresence } from 'framer-motion';
import type { Perfume } from '@/lib/types';
import { getNotesByProgress } from '@/lib/utils';
import NoteCard from './NoteCard';

interface Props {
  perfume: Perfume;
  progress: number;
}

const STAGE_LABELS = {
  top: '前调',
  heart: '中调',
  base: '后调',
};

export default function NoteCards({ perfume, progress }: Props) {
  const { topNotes, heartNotes, baseNotes } = getNotesByProgress(progress, perfume);

  const rows: Array<{
    key: 'top' | 'heart' | 'base';
    notes: typeof topNotes;
  }> = [
    { key: 'top', notes: topNotes },
    { key: 'heart', notes: heartNotes },
    { key: 'base', notes: baseNotes },
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ key, notes }) => (
        <div key={key} className="min-h-[32px]">
          {notes.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-white/40 w-8 pt-1 flex-shrink-0">
                {STAGE_LABELS[key]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence mode="popLayout">
                  {notes.map(({ note, opacity }) => (
                    <NoteCard
                      key={`${key}-${note}`}
                      note={note}
                      opacity={opacity}
                      stage={key}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
