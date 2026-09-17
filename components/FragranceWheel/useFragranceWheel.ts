'use client';

import { useEffect, useRef } from 'react';
import {
  FAMILY_ORDER,
  FAMILY_LABELS,
  FAMILY_COLORS,
  SUBFAMILIES,
  SUBFAMILY_LABELS,
} from '@/lib/fragranceData';

// Re-export so existing imports from this file still work
export { FAMILY_ORDER, FAMILY_LABELS, FAMILY_COLORS, SUBFAMILIES, SUBFAMILY_LABELS };

interface SubfamilyArcDatum {
  family: string;
  subfamilyId: string;
  subfamilyLabel: string;
  subfamilyColor: string;
  startAngle: number;
  endAngle: number;
}

interface UseFragranceWheelOptions {
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

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const svg = d3.select(svgRef.current);
      const { onFamilyHover, onFamilyClick, onSubfamilyClick } = optionsRef.current;
      const resetDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;

      svg.selectAll('*').remove();

      const size = 560;
      const r = size / 2;

      // 三层半径：中心圆 → 大类环 → 细分环
      const innerR = r * 0.35;   // 中心圆外缘
      const familyMidR = r * 0.57;   // 大类环外缘（兼内层）
      const outerR = r * 0.85;   // 细分环外缘
      const outerHoverR = outerR + 6;   // Subtle hover/selection expansion

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
        .outerRadius(familyMidR + 3);

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
        .attr('fill-opacity', 1)
        .attr('stroke', '#F3EFE7')
        .attr('stroke-width', 1)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (d) => `${FAMILY_LABELS[d.data] ?? d.data} fragrance family`)
        .attr('aria-pressed', (d) => d.data === optionsRef.current.selectedFamily ? 'true' : 'false')
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
            .attr('fill-opacity', 1)
            .attr('stroke', isSelected ? '#795B38' : '#F3EFE7')
            .attr('stroke-width', isSelected ? 1.25 : 1);
          onFamilyHover(null, 0, 0);
        })
        .on('click', (_, d) => onFamilyClick(d.data))
        .on('keydown', (event, d) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onFamilyClick(d.data);
          }
        });

      // 大类文字标签（居中于内环）
      g.selectAll('text.family-label')
        .data(arcs)
        .enter()
        .append('text')
        .attr('class', 'family-label')
        .style('font-family', "'Songti SC', 'STSong', 'Noto Serif CJK SC', serif")
        .style('font-size', '12px')
        .style('font-weight', '500')
        .style('letter-spacing', '0.02em')
        .style('fill', '#282620')
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
        .attr('fill-opacity', 1)
        .attr('stroke', '#F3EFE7')
        .attr('stroke-width', 1)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (d) => `${d.subfamilyLabel}, ${FAMILY_LABELS[d.family] ?? d.family}`)
        .attr('aria-pressed', (d) => d.subfamilyId === optionsRef.current.selectedSubfamily ? 'true' : 'false')
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
          const { selectedFamily, selectedSubfamily } = optionsRef.current;
          const familyActive = d.family === selectedFamily;
          const isSelected = d.subfamilyId === selectedSubfamily;
          const expand = isSelected || (familyActive && !selectedSubfamily);
          d3.select(this)
            .attr('d', expand ? (subfamilyArcHover(d) ?? '') : (subfamilyArcPath(d) ?? ''))
            .attr('fill-opacity', 1)
            .attr('stroke', isSelected ? '#795B38' : '#F3EFE7')
            .attr('stroke-width', 1);
          onFamilyHover(null, 0, 0);
        })
        .on('click', (_, d) => onSubfamilyClick(d.family, d.subfamilyId))
        .on('keydown', (event, d) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSubfamilyClick(d.family, d.subfamilyId);
          }
        });

      // 细分标签（沿弧旋转）
      g.selectAll('text.subfamily-label')
        .data(subfamilyArcs)
        .enter()
        .append('text')
        .attr('class', 'subfamily-label')
        .style('font-family', "'Songti SC', 'STSong', 'Noto Serif CJK SC', serif")
        .style('font-size', '10.5px')
        .style('font-weight', '400')
        .style('letter-spacing', '0.01em')
        .style('fill', '#282620')
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
        .attr('stroke', '#F3EFE7')
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
          svgTyped.transition().duration(resetDuration).call(zoom.transform, d3.zoomIdentity);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 更新选中大类的弧段高亮（内环 + 外环）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedFamily } = optionsRef.current;
      const svg = d3.select(svgRef.current);
      const transitionDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;

      const size = 560;
      const r = size / 2;
      const innerR = r * 0.35;
      const familyMidR = r * 0.57;
      const outerR = r * 0.85;
      const outerSelR = outerR + 6;

      const pie = d3.pie<string>().value(() => 1).sort(null);
      const arcs = pie(FAMILY_ORDER as unknown as string[]);
      const arcMap = new Map(arcs.map((a) => [a.data, a]));

      const familyArcPath = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR).outerRadius(familyMidR);
      const familyArcSel = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR).outerRadius(familyMidR + 3);

      svg.selectAll<SVGPathElement, d3.PieArcDatum<string>>('path.family-segment')
        .each(function (d) {
          const isSelected = d.data === selectedFamily;
          const datum = arcMap.get(d.data) ?? d;
          d3.select(this)
            .transition().duration(transitionDuration)
            .attr('d', isSelected ? (familyArcSel(datum) ?? '') : (familyArcPath(datum) ?? ''))
            .attr('fill-opacity', 1)
            .attr('stroke', isSelected ? '#795B38' : '#F3EFE7')
            .attr('stroke-width', isSelected ? 1.25 : 1)
            .attr('aria-pressed', isSelected ? 'true' : 'false');
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
          const isSubSel = !!selectedSubfamily && d.subfamilyId === selectedSubfamily;
          const expand = isSubSel || (familyActive && !selectedSubfamily);
          d3.select(this)
            .transition().duration(transitionDuration)
            .attr('d', expand ? (subfamilyArcSel(d) ?? '') : (subfamilyArcPath(d) ?? ''))
            .attr('fill-opacity', 1)
            .attr('stroke', isSubSel ? '#795B38' : '#F3EFE7')
            .attr('stroke-width', 1)
            .attr('aria-pressed', isSubSel ? 'true' : 'false');
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedFamily, options.selectedSubfamily]);
}
