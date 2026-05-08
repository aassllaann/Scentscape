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
  onPerfumeClick: (perfume: Perfume) => void;
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
        .append('g')
        .attr('class', 'wheel-root');

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
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mousemove', function (event, d) {
          onFamilyHover(d.data, event.clientX, event.clientY);
        })
        .on('mouseout', function (event, d) {
          const isSelected = d.data === optionsRef.current.selectedFamily;
          d3.select(this)
            .attr('d', isSelected ? (arcHover(d) ?? '') : (arcPath(d) ?? ''))
            .attr('fill-opacity', isSelected ? 1 : 0.85)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')
            .attr('stroke-width', isSelected ? 2.5 : 1.5);
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

      // ── D3 缩放 / 平移 ──────────────────────────────────────────
      // 用非空断言拿到正确类型，让 .call(zoom) 编译通过
      const svgNode = svgRef.current!;
      const svgTyped = d3.select<SVGSVGElement, unknown>(svgNode);
      const root = svg.select<SVGGElement>('g.wheel-root');

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 10])
        .on('start', () => { svgNode.style.cursor = 'grabbing'; })
        .on('zoom',  (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          root.attr('transform', event.transform.toString());
        })
        .on('end',   () => { svgNode.style.cursor = 'grab'; });

      svgTyped.call(zoom)
        .on('dblclick.zoom', null)           // 禁掉 D3 默认双击放大
        .on('dblclick', () => {              // 双击重置视角
          svgTyped.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.perfumes]);

  // 更新选中族群的弧段高亮
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedFamily } = optionsRef.current;

      const size = 400;
      const r = size / 2;
      const innerR = r * 0.35;
      const outerR = r * 0.85;
      const outerSelectedR = r * 0.92;

      const pie = d3.pie<string>().value(() => 1).sort(null);
      const arcs = pie(FAMILY_ORDER as unknown as string[]);

      const arcPath = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(outerR);

      const arcSelected = d3.arc<d3.PieArcDatum<string>>()
        .innerRadius(innerR)
        .outerRadius(outerSelectedR);

      const arcMap = new Map(arcs.map((a) => [a.data, a]));

      d3.select(svgRef.current)
        .selectAll<SVGPathElement, d3.PieArcDatum<string>>('path.arc-segment')
        .each(function (d) {
          const isSelected = d.data === selectedFamily;
          const arcDatum = arcMap.get(d.data) ?? d;
          d3.select(this)
            .transition()
            .duration(250)
            .attr('d', isSelected ? (arcSelected(arcDatum) ?? '') : (arcPath(arcDatum) ?? ''))
            .attr('fill-opacity', isSelected ? 1 : 0.85)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')
            .attr('stroke-width', isSelected ? 2.5 : 1.5);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedFamily]);

  // 渲染选中香调的香水圆点节点
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedFamily, perfumes, onPerfumeClick } = optionsRef.current;
      const svg = d3.select(svgRef.current);

      // 清除旧圆点层
      svg.selectAll('g.perfume-dots-layer').remove();

      if (!selectedFamily) return;

      const familyPerfumes = perfumes.filter((p) => p.fragranceFamily === selectedFamily);
      if (familyPerfumes.length === 0) return;

      const color = FAMILY_COLORS[selectedFamily] ?? '#888';
      const r = 200; // 与主绘制保持一致

      // 基于香调名生成确定性随机（相同香调每次位置一致）
      const seededRand = (n: number) => {
        const x = Math.sin(n + 1) * 10000;
        return x - Math.floor(x);
      };
      const fSeed = selectedFamily.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      const minR = r * 1.18;  // 轮盘外缘最小距离
      const maxR = r * 3.8;   // 最远扩散半径（溢出视口产生屏幕填充感）

      const layer = svg.select<SVGGElement>('g.wheel-root')
        .append('g').attr('class', 'perfume-dots-layer');

      const nodes = layer
        .selectAll<SVGGElement, Perfume>('g.perfume-dot-node')
        .data(familyPerfumes, (d) => d.id)
        .enter()
        .append('g')
        .attr('class', 'perfume-dot-node')
        .attr('transform', (d, i) => {
          const ra = seededRand(fSeed * 17 + i * 7);      // 角度 0-2π
          const rr = seededRand(fSeed * 17 + i * 7 + 1);  // 半径 0-1
          const angle = ra * Math.PI * 2;
          // sqrt 分布让点更均匀散布到外圈而非堆在中心
          const radius = minR + Math.sqrt(rr) * (maxR - minR);
          return `translate(${radius * Math.cos(angle)}, ${radius * Math.sin(angle)})`;
        })
        .style('cursor', 'pointer');

      nodes.each(function (d, i) {
        const nodeG = d3.select(this);

        // 内层 g：负责浮动动画，与外层定位分离
        const floatG = nodeG.append('g').attr('class', 'dot-float');

        // 光晕
        floatG
          .append('circle')
          .attr('class', 'dot-aura')
          .attr('r', 30)
          .attr('fill', color)
          .attr('fill-opacity', 0.12)
          .attr('stroke', 'none');

        // 主圆点（入场动画）
        floatG
          .append('circle')
          .attr('class', 'main-dot')
          .attr('r', 0)
          .attr('fill', color)
          .attr('fill-opacity', 0.85)
          .attr('stroke', 'rgba(255,255,255,0.55)')
          .attr('stroke-width', 2)
          .transition()
          .duration(400)
          .delay(i * 50)
          .attr('r', 16);

        // 香水名称标签
        floatG
          .append('text')
          .attr('y', 30)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('fill', `${color}ee`)
          .style('pointer-events', 'none')
          .text(d.name.length > 16 ? d.name.slice(0, 16) + '\u2026' : d.name);

        // SMIL 浮动动画（在内层 g 上，不干扰外层定位 transform）
        const floatEl = floatG.node();
        if (floatEl) {
          const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
          const amp = 4 + (i % 4);
          const dur = 1.8 + (i % 5) * 0.25;
          anim.setAttribute('attributeName', 'transform');
          anim.setAttribute('type', 'translate');
          anim.setAttribute('values', `0,${amp}; 0,${-amp}; 0,${amp}`);
          anim.setAttribute('dur', `${dur}s`);
          anim.setAttribute('repeatCount', 'indefinite');
          floatEl.appendChild(anim);
        }

        // Hover 效果
        nodeG
          .on('mouseover', () => {
            nodeG
              .select<SVGCircleElement>('.main-dot')
              .attr('fill-opacity', 1)
              .attr('r', 22)
              .attr('stroke', 'rgba(255,255,255,0.9)')
              .attr('stroke-width', 2.5);
            nodeG
              .select<SVGCircleElement>('.dot-aura')
              .attr('fill-opacity', 0.3);
          })
          .on('mouseout', () => {
            nodeG
              .select<SVGCircleElement>('.main-dot')
              .attr('fill-opacity', 0.85)
              .attr('r', 16)
              .attr('stroke', 'rgba(255,255,255,0.55)')
              .attr('stroke-width', 2);
            nodeG
              .select<SVGCircleElement>('.dot-aura')
              .attr('fill-opacity', 0.12);
          })
          .on('click', (event) => {
            event.stopPropagation();
            onPerfumeClick(d);
          });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedFamily, options.perfumes]);

  // 更新圆点选中高亮（不重建整个点层）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!svgRef.current) return;

    import('d3').then((d3) => {
      const { selectedPerfume } = optionsRef.current;

      d3.select(svgRef.current)
        .selectAll<SVGGElement, Perfume>('g.perfume-dot-node')
        .each(function (d) {
          const isSelected = selectedPerfume?.id === d.id;
          d3.select(this)
            .select<SVGCircleElement>('.main-dot')
            .transition()
            .duration(200)
            .attr('r', isSelected ? 22 : 16)
            .attr('fill-opacity', isSelected ? 1 : 0.85)
            .attr('stroke', isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)')
            .attr('stroke-width', isSelected ? 3 : 2);
          d3.select(this)
            .select<SVGCircleElement>('.dot-aura')
            .transition()
            .duration(200)
            .attr('r', isSelected ? 42 : 30)
            .attr('fill-opacity', isSelected ? 0.32 : 0.12);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedPerfume]);

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
