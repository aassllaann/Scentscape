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

// Clear botanical hues; opaque wheel fills keep them independent of the mood canvas.
export const FAMILY_COLORS: Record<string, string> = {
  Oriental: '#D39A67',
  Woody:    '#6CA68B',
  Fougere:  '#92AF6D',
  Leather:  '#A38CB9',
  Gourmand: '#D98E79',
  Citrus:   '#E4BF64',
  Fresh:    '#73BBB0',
  Aquatic:  '#79AACC',
  Floral:   '#D694AD',
};

export const SUBFAMILIES: Record<string, Array<{ id: string; label: string; color: string }>> = {
  Oriental: [
    { id: 'oriental-vanilla',  label: '香草东方', color: '#DEAE7B' },
    { id: 'soft-oriental',     label: '柔东方',   color: '#E5B99A' },
    { id: 'oriental-spicy',    label: '辛香东方', color: '#C88961' },
    { id: 'oriental-floral',   label: '花香东方', color: '#CD8E8F' },
  ],
  Woody: [
    { id: 'woody-aromatic',    label: '木质芳香', color: '#80B59C' },
    { id: 'mossy-woods',       label: '苔藓木质', color: '#619A7F' },
    { id: 'dry-woods',         label: '干木质',   color: '#A8B981' },
    { id: 'sandalwood',        label: '檀木调',   color: '#C5B28A' },
  ],
  Fougere: [
    { id: 'classic-fougere',   label: '经典馥奇', color: '#99B779' },
    { id: 'soft-fougere',      label: '柔馥奇',   color: '#ACC68F' },
    { id: 'fresh-fougere',     label: '清新馥奇', color: '#83B19A' },
  ],
  Leather: [
    { id: 'leather-smoky',     label: '烟熏皮革', color: '#9685B0' },
    { id: 'leather-suede',     label: '麂皮革',   color: '#BA9EC9' },
    { id: 'tobacco-leather',   label: '烟草皮革', color: '#A18EA7' },
  ],
  Gourmand: [
    { id: 'gourmand-vanilla',  label: '香草美食', color: '#E5B18A' },
    { id: 'gourmand-caramel',  label: '焦糖美食', color: '#D89B70' },
    { id: 'gourmand-spicy',    label: '辛香美食', color: '#CE847A' },
  ],
  Citrus: [
    { id: 'citrus-aromatic',   label: '柑橘芳香', color: '#E8C970' },
    { id: 'citrus-floral',     label: '柑橘花香', color: '#F0CF92' },
    { id: 'hesperidic',        label: '西柚清柑', color: '#E2B15B' },
  ],
  Fresh: [
    { id: 'fresh-green',       label: '绿叶清新', color: '#96C9AC' },
    { id: 'fresh-aromatic',    label: '芳香清新', color: '#70B6A4' },
    { id: 'fresh-spice',       label: '辛香清新', color: '#B3CF91' },
  ],
  Aquatic: [
    { id: 'aquatic-marine',    label: '海洋水生', color: '#7EAFD0' },
    { id: 'aquatic-oceanic',   label: '远洋水生', color: '#6B98BF' },
    { id: 'aqua-fresh',        label: '水感清新', color: '#91C6D5' },
  ],
  Floral: [
    { id: 'floral-soft',       label: '柔花香',   color: '#DDA5BA' },
    { id: 'floral-fresh',      label: '清新花香', color: '#E8B7C7' },
    { id: 'floral-oriental',   label: '东方花香', color: '#C78CA9' },
    { id: 'floral-aldehyde',   label: '醛香花香', color: '#EBC7D5' },
  ],
};

export const SUBFAMILY_LABELS: Record<string, string> = Object.values(SUBFAMILIES)
  .flat()
  .reduce<Record<string, string>>((acc, s) => { acc[s.id] = s.label; return acc; }, {});
