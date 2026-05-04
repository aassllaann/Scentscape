'use client';

import { motion } from 'framer-motion';

interface Props {
  note: string;
  opacity: number;
  stage: 'top' | 'heart' | 'base';
}

const STAGE_COLORS = {
  top: 'rgba(56, 189, 248, 0.25)',    // sky
  heart: 'rgba(251, 113, 133, 0.25)', // rose
  base: 'rgba(251, 191, 36, 0.25)',   // amber
};

const STAGE_BORDER = {
  top: 'rgba(56, 189, 248, 0.5)',
  heart: 'rgba(251, 113, 133, 0.5)',
  base: 'rgba(251, 191, 36, 0.5)',
};

const STAGE_TEXT = {
  top: 'rgb(186, 230, 253)',
  heart: 'rgb(254, 205, 211)',
  base: 'rgb(253, 230, 138)',
};

export default function NoteCard({ note, opacity, stage }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0.82 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: STAGE_COLORS[stage],
        border: `1px solid ${STAGE_BORDER[stage]}`,
        color: STAGE_TEXT[stage],
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: STAGE_TEXT[stage] }}
      />
      {note}
    </motion.div>
  );
}
