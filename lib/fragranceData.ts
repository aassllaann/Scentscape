// Pure data constants — no 'use client', safe to import in server components

export const FAMILY_ORDER = [
  'Oriental',
  'Woody',
  'Fougere',
  'Leather',
  'Gourmand',
  'Citrus',
  'Fresh',
  'Aquatic',
  'Floral',
] as const;

export const FAMILY_LABELS: Record<string, string> = {
  Oriental: '东方调',
  Woody: '木质调',
  Fougere: '馥奇调',
  Leather: '皮革调',
  Gourmand: '美食调',
  Citrus: '柑橘调',
  Fresh: '清新调',
  Aquatic: '水生调',
  Floral: '花香调',
};

export const FAMILY_COLORS: Record<string, string> = {
  Oriental: '#8B4513',
  Woody:    '#4A7A30',
  Fougere:  '#7B6B47',
  Leather:  '#3D3D5C',
  Gourmand: '#C8773A',
  Citrus:   '#FFD166',
  Fresh:    '#87CEEB',
  Aquatic:  '#4A90C4',
  Floral:   '#DDA0DD',
};

export const SUBFAMILIES: Record<string, Array<{ id: string; label: string; color: string }>> = {
  Oriental: [
    { id: 'oriental-vanilla',  label: '香草东方', color: '#A05828' },
    { id: 'soft-oriental',     label: '柔东方',   color: '#C07040' },
    { id: 'oriental-spicy',    label: '辛香东方', color: '#6B3015' },
    { id: 'oriental-floral',   label: '花香东方', color: '#904060' },
  ],
  Woody: [
    { id: 'woody-aromatic',    label: '木质芳香', color: '#527A38' },
    { id: 'mossy-woods',       label: '苔藓木质', color: '#3A6B2A' },
    { id: 'dry-woods',         label: '干木质',   color: '#7B8A30' },
    { id: 'sandalwood',        label: '檀木调',   color: '#8B7355' },
  ],
  Fougere: [
    { id: 'classic-fougere',   label: '经典馥奇', color: '#8B7A55' },
    { id: 'soft-fougere',      label: '柔馥奇',   color: '#6B5A37' },
    { id: 'fresh-fougere',     label: '清新馥奇', color: '#6B8A5A' },
  ],
  Leather: [
    { id: 'leather-smoky',     label: '烟熏皮革', color: '#4A4570' },
    { id: 'leather-suede',     label: '麂皮革',   color: '#5C3D6B' },
    { id: 'tobacco-leather',   label: '烟草皮革', color: '#332850' },
  ],
  Gourmand: [
    { id: 'gourmand-vanilla',  label: '香草美食', color: '#D4853A' },
    { id: 'gourmand-caramel',  label: '焦糖美食', color: '#B86020' },
    { id: 'gourmand-spicy',    label: '辛香美食', color: '#A84838' },
  ],
  Citrus: [
    { id: 'citrus-aromatic',   label: '柑橘芳香', color: '#FFD166' },
    { id: 'citrus-floral',     label: '柑橘花香', color: '#FFB040' },
    { id: 'hesperidic',        label: '西柚清柑', color: '#E8A018' },
  ],
  Fresh: [
    { id: 'fresh-green',       label: '绿叶清新', color: '#7FBF7F' },
    { id: 'fresh-aromatic',    label: '芳香清新', color: '#6BAF5A' },
    { id: 'fresh-spice',       label: '辛香清新', color: '#9FCF7F' },
  ],
  Aquatic: [
    { id: 'aquatic-marine',    label: '海洋水生', color: '#4A90C4' },
    { id: 'aquatic-oceanic',   label: '远洋水生', color: '#3A78B0' },
    { id: 'aqua-fresh',        label: '水感清新', color: '#5AAFD4' },
  ],
  Floral: [
    { id: 'floral-soft',       label: '柔花香',   color: '#DDA0DD' },
    { id: 'floral-fresh',      label: '清新花香', color: '#CC80CC' },
    { id: 'floral-oriental',   label: '东方花香', color: '#BB70AA' },
    { id: 'floral-aldehyde',   label: '醛香花香', color: '#EEBFEE' },
  ],
};

export const SUBFAMILY_LABELS: Record<string, string> = Object.values(SUBFAMILIES)
  .flat()
  .reduce<Record<string, string>>((acc, s) => { acc[s.id] = s.label; return acc; }, {});
