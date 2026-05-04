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
