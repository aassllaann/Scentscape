'use client';

import { useEffect, useRef } from 'react';
import type { Perfume } from '@/lib/types';

// 香调族群顺序（遵循 Michael Edwards 香调轮冷暖分布）
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

// 族群中文名
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

// 族群主色
export const FAMILY_COLORS: Record<string, string> = {
  Oriental: '#8B4513',
  Woody: '#4A7A30',
  Fougere: '#7B6B47',
  Leather: '#3D3D5C',
  Gourmand: '#C8773A',
  Citrus: '#FFD166',
  Fresh: '#87CEEB',
  Aquatic: '#4A90C4',
  Floral: '#DDA0DD',
};

// 细分香调定义（每个大类下的亚类）
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

// 从 subfamilyId 反查中文名的快捷 map
export const SUBFAMILY_LABELS: Record<string, string> = Object.values(SUBFAMILIES)
  .flat()
  .reduce<Record<string, string>>((acc, s) => { acc[s.id] = s.label; return acc; }, {});

interface SubfamilyArcDatum {
  family: string;
  subfamilyId: string;
  subfamilyLabel: string;
  subfamilyColor: string;
  startAngle: number;
  endAngle: number;
}

interface UseFragranceWheelOptions {
  perfumes: Perfume[];
  selectedFamily: string | null;
  selectedSubfamily: string | null;
  onFamilyHover: (family: string | null, x: number, y: number, subfamilyId?: string) => void;
  onFamilyClick: (family: string) => void;
  onSubfamilyClick: (family: string, subfamilyId: string) => void;
}

export function useFragranceWheel(
  svgRef: React.RefObject<SVGSVGElement | null>,
  options: UseFragranceWheelOptions
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const svg = d3.select(svgRef.current);
      const { perfumes, onFamilyHover, onFamilyClick, onSubfamilyClick } = optionsRef.current;

      svg.selectAll('*').remove();

      const size = 560;
      const r = size / 2;

      // 三层半径：中心圆 → 大类环 → 细分环
      const innerR      = r * 0.35;   // 中心圆外缘
      const familyMidR  = r * 0.57;   // 大类环外缘（兼内层）
      const outerR      = r * 0.85;   // 细分环外缘
      const outerHoverR = r * 0.92;   // hover/选中时外扩

      const g = svg
        .attr('viewBox', `-${r} -${r} ${size} ${size}`)
        .append('g')
        .attr('class', 'wheel-root');

      const pie = d3.pie<string>().value(() => 1).sort(null);
      const arcs = pie(FAMILY_ORDER as unknown as string[]);

      // ── 大类弧（内环）──────────────────────────────────────────────
      const familyArcPath = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(familyMidR);

      const familyArcHover = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(familyMidR + 6);

      const familyArcLabel = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius((innerR + familyMidR) / 2)
        .outerRadius((innerR + familyMidR) / 2);

      const familySegments = g
        .selectAll('path.family-segment')
        .data(arcs)
        .enter()
        .append('path')
        .attr('class', 'family-segment')
        .attr('d', familyArcPath)
        .attr('fill', (d) => FAMILY_COLORS[d.data] ?? '#888')
        .attr('fill-opacity', 0.9)
        .attr('stroke', 'rgba(0,0,0,0.35)')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer');

      familySegments
        .on('mouseover', function (event, d) {
          d3.select(this).attr('d', familyArcHover(d) ?? '').attr('fill-opacity', 1);
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mousemove', function (event, d) {
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mouseout', function (_, d) {
          const isSelected = d.data === optionsRef.current.selectedFamily;
          d3.select(this)
            .attr('d', isSelected ? (familyArcHover(d) ?? '') : (familyArcPath(d) ?? ''))
            .attr('fill-opacity', isSelected ? 1 : 0.9)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)')
            .attr('stroke-width', isSelected ? 2.5 : 1.5);
          onFamilyHover(null, 0, 0);
        })
        .on('click', (_, d) => onFamilyClick(d.data));

      // 大类文字标签（居中于内环）
      g.selectAll('text.family-label')
        .data(arcs)
        .enter()
        .append('text')
        .attr('class', 'family-label')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('fill', 'rgba(255,255,255,0.92)')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('transform', (d) => {
          const c = familyArcLabel.centroid(d);
          return `translate(${c[0]},${c[1]})`;
        })
        .text((d) => FAMILY_LABELS[d.data] ?? d.data);

      // ── 细分香调弧（外环）──────────────────────────────────────────
      const subfamilyArcs: SubfamilyArcDatum[] = [];
      arcs.forEach((familyArc) => {
        const family = familyArc.data;
        const subs = SUBFAMILIES[family] ?? [];
        if (subs.length === 0) return;
        const span = familyArc.endAngle - familyArc.startAngle;
        const subSpan = span / subs.length;
        subs.forEach((sub, i) => {
          subfamilyArcs.push({
            family,
            subfamilyId: sub.id,
            subfamilyLabel: sub.label,
            subfamilyColor: sub.color,
            startAngle: familyArc.startAngle + i * subSpan,
            endAngle: familyArc.startAngle + (i + 1) * subSpan,
          });
        });
      });

      const subfamilyArcPath = d3.arc<SubfamilyArcDatum>()
        .innerRadius(familyMidR + 2)
        .outerRadius(outerR)
        .startAngle((d) => d.startAngle)
        .endAngle((d) => d.endAngle)
        .padAngle(0.012);

      const subfamilyArcHover = d3.arc<SubfamilyArcDatum>()
        .innerRadius(familyMidR + 2)
        .outerRadius(outerHoverR)
        .startAngle((d) => d.startAngle)
        .endAngle((d) => d.endAngle)
        .padAngle(0.012);

      const subfamilyLabelArc = d3.arc<SubfamilyArcDatum>()
        .innerRadius((familyMidR + outerR) / 2)
        .outerRadius((familyMidR + outerR) / 2)
        .startAngle((d) => d.startAngle)
        .endAngle((d) => d.endAngle);

      const subSegments = g
        .selectAll('path.subfamily-segment')
        .data(subfamilyArcs)
        .enter()
        .append('path')
        .attr('class', 'subfamily-segment')
        .attr('d', subfamilyArcPath)
        .attr('fill', (d) => d.subfamilyColor)
        .attr('fill-opacity', 0.82)
        .attr('stroke', 'rgba(0,0,0,0.25)')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer');

      subSegments
        .on('mouseover', function (event, d) {
          d3.select(this).attr('d', subfamilyArcHover(d) ?? '').attr('fill-opacity', 1);
          onFamilyHover(d.family, event.clientX, event.clientY, d.subfamilyId);
        })
        .on('mousemove', function (event, d) {
          onFamilyHover(d.family, event.clientX, event.clientY, d.subfamilyId);
        })
        .on('mouseout', function (_, d) {
          const isSelected = d.family === optionsRef.current.selectedFamily;
          d3.select(this)
            .attr('d', isSelected ? (subfamilyArcHover(d) ?? '') : (subfamilyArcPath(d) ?? ''))
            .attr('fill-opacity', isSelected ? 1 : 0.82)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)');
          onFamilyHover(null, 0, 0);
        })
        .on('click', (_, d) => onSubfamilyClick(d.family, d.subfamilyId));

      // 细分标签（沿弧旋转）
      g.selectAll('text.subfamily-label')
        .data(subfamilyArcs)
        .enter()
        .append('text')
        .attr('class', 'subfamily-label')
        .style('font-size', '8px')
        .style('fill', 'rgba(255,255,255,0.80)')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', (d) => {
          const c = subfamilyLabelArc.centroid(d);
          const midAngle = (d.startAngle + d.endAngle) / 2;
          const rotDeg = (midAngle - Math.PI / 2) * (180 / Math.PI);
          const flip = midAngle > Math.PI;
          return `translate(${c[0]},${c[1]}) rotate(${flip ? rotDeg + 180 : rotDeg})`;
        })
        .text((d) => d.subfamilyLabel);

      // ── 中心圆 ──────────────────────────────────────────────────────
      g.append('circle')
        .attr('r', innerR * 0.95)
        .attr('fill', 'rgba(0,0,0,0.4)')
        .attr('stroke', 'rgba(255,255,255,0.15)')
        .attr('stroke-width', 1);

      // ── 缩放 / 平移 ─────────────────────────────────────────────────
      const svgNode = svgRef.current!;
      const svgTyped = d3.select<SVGSVGElement, unknown>(svgNode);
      const root = svg.select<SVGGElement>('g.wheel-root');

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 10])
        .on('start', () => { svgNode.style.cursor = 'grabbing'; })
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          root.attr('transform', event.transform.toString());
        })
        .on('end', () => { svgNode.style.cursor = 'grab'; });

      svgTyped.call(zoom)
        .on('dblclick.zoom', null)
        .on('dblclick', () => {
          svgTyped.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.perfumes]);

  // 更新选中大类的弧段高亮（内环 + 外环）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedFamily } = optionsRef.current;
      const svg = d3.select(svgRef.current);

      const size = 560;
      const r = size / 2;
      const innerR     = r * 0.35;
      const familyMidR = r * 0.57;
      const outerR     = r * 0.85;
      const outerSelR  = r * 0.92;

      const pie = d3.pie<string>().value(() => 1).sort(null);
      const arcs = pie(FAMILY_ORDER as unknown as string[]);
      const arcMap = new Map(arcs.map((a) => [a.data, a]));

      const familyArcPath = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR).outerRadius(familyMidR);
      const familyArcSel = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR).outerRadius(familyMidR + 6);

      svg.selectAll<SVGPathElement, d3.PieArcDatum<string>>('path.family-segment')
        .each(function (d) {
          const isSelected = d.data === selectedFamily;
          const datum = arcMap.get(d.data) ?? d;
          d3.select(this)
            .transition().duration(250)
            .attr('d', isSelected ? (familyArcSel(datum) ?? '') : (familyArcPath(datum) ?? ''))
            .attr('fill-opacity', isSelected ? 1 : 0.9)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)')
            .attr('stroke-width', isSelected ? 2.5 : 1.5);
        });

      // 外环：选中家族的所有细分格子也跟着外扩
      const subfamilyArcPath = d3.arc<SubfamilyArcDatum>()
        .innerRadius(familyMidR + 2).outerRadius(outerR)
        .startAngle((d) => d.startAngle).endAngle((d) => d.endAngle).padAngle(0.012);
      const subfamilyArcSel = d3.arc<SubfamilyArcDatum>()
        .innerRadius(familyMidR + 2).outerRadius(outerSelR)
        .startAngle((d) => d.startAngle).endAngle((d) => d.endAngle).padAngle(0.012);

      const { selectedSubfamily } = optionsRef.current;
      svg.selectAll<SVGPathElement, SubfamilyArcDatum>('path.subfamily-segment')
        .each(function (d) {
          const familyActive = d.family === selectedFamily;
          // 有细分选中时：选中的细分高亮，同家族其他细分半透明，其余暗淡
          const isSubSel = !!selectedSubfamily && d.subfamilyId === selectedSubfamily;
          const dimmed   = familyActive && !!selectedSubfamily && !isSubSel;
          const expand   = isSubSel || (familyActive && !selectedSubfamily);
          d3.select(this)
            .transition().duration(250)
            .attr('d', expand ? (subfamilyArcSel(d) ?? '') : (subfamilyArcPath(d) ?? ''))
            .attr('fill-opacity', isSubSel ? 1 : dimmed ? 0.35 : familyActive ? 0.9 : 0.82)
            .attr('stroke', isSubSel ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)')
            .attr('stroke-width', isSubSel ? 1.5 : 1);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedFamily, options.selectedSubfamily]);

}
