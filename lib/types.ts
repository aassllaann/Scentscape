export type TextureType = 'smooth' | 'grainy' | 'crystalline';

export interface VisualParams {
  primaryColor: string;
  accentColor: string;
  warmth: number;    // 0–1, 0=极冷, 1=极暖
  density: number;   // 0–1, 背景粒子密度
  texture: TextureType;
  keywords: string[];
}

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  year: number;
  gender: string;
  fragranceFamily: string;
  subfamilyId: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  moodTags: string[];
  moodScores: Record<string, number>;
  intensityCurve: number[]; // 5个值，0–1
  visualParams: VisualParams;
  imageUrl?: string;
  description?: string;
  notes?: string[];
}

export interface FamilyMapEntry {
  primaryColor: string;
  accentColor: string;
  warmth: number;
  density: number;
  texture: TextureType;
  keywords: string[];
}

export type FamilyMap = Record<string, FamilyMapEntry>;

export interface NoteWithOpacity {
  note: string;
  opacity: number;
}

export interface NoteStageResult {
  topNotes: NoteWithOpacity[];
  heartNotes: NoteWithOpacity[];
  baseNotes: NoteWithOpacity[];
}

// ── AI Visual ────────────────────────────────────────────────────────────────

export interface AIColorStop {
  hex: string;    // e.g. "#C8A26B"
  label: string;  // material name, e.g. "sandalwood amber"
  weight: number; // 0–1, sum ~1
}

export interface AICanvasHints {
  technique: 'particles' | 'waves' | 'smoke' | 'aurora' | 'crystals' | 'organic';
  speed: 'slow' | 'medium' | 'fast';
  density: 'sparse' | 'medium' | 'dense';
  backgroundGradient: string; // CSS gradient string
}

// Agent 1 output: visual concept (no code)
export interface AIVisualConcept {
  perfumeId: string;
  palette: AIColorStop[];
  dominantMood: string;
  motionStyle: string;
  visualMetaphors: string[];
  canvasHints: AICanvasHints;
  description: string;    // 中文诗意描述
  descriptionEn: string;  // English
}

// Agent 2 output: runnable canvas HTML
export interface AIVisualRender {
  perfumeId: string;
  html: string;         // complete self-contained HTML
  generatedAt: number;  // Date.now()
}

// Combined (cached in sessionStorage)
export interface AIVisualResult {
  concept: AIVisualConcept;
  render: AIVisualRender;
}
