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

// 族群颜色
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

interface UseFragranceWheelOptions {
  perfumes: Perfume[];
  selectedFamily: string | null;
  selectedPerfume: Perfume | null;
  onFamilyHover: (family: string | null, x: number, y: number) => void;
  onFamilyClick: (family: string) => void;
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

    // 动态导入 D3（避免 SSR 问题）
    import('d3').then((d3) => {
      const svg = d3.select(svgRef.current);
      const { perfumes, onFamilyHover, onFamilyClick } = optionsRef.current;

      svg.selectAll('*').remove();

      const size = 400;
      const r = size / 2;
      const innerR = r * 0.35;
      const outerR = r * 0.85;
      const outerHoverR = r * 0.92;

      const g = svg
        .attr('viewBox', `-${r} -${r} ${size} ${size}`)
        .append('g');

      const pie = d3.pie<string>().value(() => 1).sort(null);
      const arcs = pie(FAMILY_ORDER as unknown as string[]);

      const arcPath = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(outerR);

      const arcHover = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(outerHoverR);

      const arcLabel = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius((innerR + outerR) / 2)
        .outerRadius((innerR + outerR) / 2);

      // 绘制弧段
      const segments = g
        .selectAll('path.arc-segment')
        .data(arcs)
        .enter()
        .append('path')
        .attr('class', 'arc-segment')
        .attr('d', arcPath)
        .attr('fill', (d) => FAMILY_COLORS[d.data] ?? '#888')
        .attr('fill-opacity', 0.85)
        .attr('stroke', 'rgba(0,0,0,0.3)')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('transition', 'd 0.2s ease, fill-opacity 0.2s ease');

      segments
        .on('mouseover', function (event, d) {
          d3.select(this)
            .attr('d', arcHover(d) ?? '')
            .attr('fill-opacity', 1);
          const [mx, my] = d3.pointer(event, svgRef.current);
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mousemove', function (event, d) {
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mouseout', function (event, d) {
          d3.select(this)
            .attr('d', arcPath(d) ?? '')
            .attr('fill-opacity', 0.85);
          onFamilyHover(null, 0, 0);
        })
        .on('click', function (event, d) {
          onFamilyClick(d.data);
        });

      // 弧形文字标签
      const defs = svg.append('defs');

      arcs.forEach((d) => {
        const mid = (d.startAngle + d.endAngle) / 2;
        const centroid = arcLabel.centroid(d);
        const pathId = `label-path-${d.data}`;

        defs
          .append('path')
          .attr('id', pathId)
          .attr('d', arcPath(d));
      });

      g.selectAll('text.arc-label')
        .data(arcs)
        .enter()
        .append('text')
        .attr('class', 'arc-label')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', 'rgba(255,255,255,0.9)')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('transform', (d) => {
          const c = arcLabel.centroid(d);
          return `translate(${c[0]},${c[1]})`;
        })
        .text((d) => FAMILY_LABELS[d.data] ?? d.data);

      // 中心圆（选中信息显示区）
      g.append('circle')
        .attr('r', innerR * 0.95)
        .attr('fill', 'rgba(0,0,0,0.4)')
        .attr('stroke', 'rgba(255,255,255,0.15)')
        .attr('stroke-width', 1);

      // 中心文字占位符（由 React 控制，此处仅绘制空白）
      g.append('text')
        .attr('id', 'wheel-center-name')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .style('font-size', '12px')
        .style('fill', 'rgba(255,255,255,0.9)')
        .style('pointer-events', 'none')
        .text('');

      g.append('text')
        .attr('id', 'wheel-center-brand')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.1em')
        .style('font-size', '10px')
        .style('fill', 'rgba(255,255,255,0.6)')
        .style('pointer-events', 'none')
        .text('点击选择香水');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.perfumes]);

  // 单独更新中心文字（不重建整个 D3 图）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedPerfume } = optionsRef.current;
      d3.select(svgRef.current)
        .select('#wheel-center-name')
        .text(selectedPerfume ? selectedPerfume.name : '');
      d3.select(svgRef.current)
        .select('#wheel-center-brand')
        .text(selectedPerfume ? selectedPerfume.brand : '点击选择香水');
    });
  }, [options.selectedPerfume]);
}
