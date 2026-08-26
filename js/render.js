/* render.js — D3/SVG 渲染器 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const G = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window);
  const T = G.HanoiCore.deepTheme;
  const MAX_STATES = 5000, LABEL_LIMIT = 800;

  function computeTransform(coords, width, height, pad) {
    const xs = coords.map(c => c[0]), ys = coords.map(c => c[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = Math.min(...ys), ymax = Math.max(...ys);
    const spanX = Math.max(xmax - xmin, 1e-6), spanY = Math.max(ymax - ymin, 1e-6);
    let scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
    if (!(scale > 0) || !Number.isFinite(scale)) scale = 1;
    return c => [
      pad + (c[0] - xmin) * scale + (width - 2 * pad - spanX * scale) / 2,
      pad + (c[1] - ymin) * scale + (height - 2 * pad - spanY * scale) / 2
    ];
  }

  function clearGraph(svgEl) {
    d3.select(svgEl).selectAll('*').remove();
  }

  function showMessage(svgEl, text) {
    clearGraph(svgEl);
    const w = svgEl.clientWidth || 800, h = svgEl.clientHeight || 500;
    d3.select(svgEl).append('text')
      .attr('x', w / 2).attr('y', h / 2)
      .attr('text-anchor', 'middle')
      .style('fill', '#ff6464').style('font-size', '18px').style('font-weight', 'bold')
      .text(text);
  }

  function renderGraph(svgEl, data, opts) {
    opts = opts || {};
    clearGraph(svgEl);
    if (data.states.length > MAX_STATES) {
      showMessage(svgEl, `状态数过多：${data.states.length}（上限 ${MAX_STATES}）`);
      return;
    }
    const w = svgEl.clientWidth || 1800, h = svgEl.clientHeight || 1000;
    const pad = 80;
    const toPx = computeTransform(data.coords, w, h, pad);
    const svg = d3.select(svgEl);
    svg.attr('viewBox', `0 0 ${w} ${h}`);

    const directed = !!data.directed;

    function edgePts(e) {
      const a = e.from !== undefined ? e.from : e[0];
      const b = e.to !== undefined ? e.to : e[1];
      return [toPx(data.coords[a]), toPx(data.coords[b])];
    }

    const edgeSel = svg.selectAll('line.edge').data(data.edges).enter()
      .append('line').attr('class', 'edge')
      .attr('x1', e => edgePts(e)[0][0])
      .attr('y1', e => edgePts(e)[0][1])
      .attr('x2', e => edgePts(e)[1][0])
      .attr('y2', e => edgePts(e)[1][1])
      .style('stroke', T.edge).style('stroke-width', 2.4)
      .style('opacity', 0.55);

    if (directed) {
      svg.append('defs').append('marker')
        .attr('id', 'arrow').attr('viewBox', '0 0 10 10')
        .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6)
        .attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .style('fill', T.edge);
      edgeSel.attr('marker-end', 'url(#arrow)');
    }

    const nodeSel = svg.selectAll('circle.node').data(data.states).enter()
      .append('circle').attr('class', 'node')
      .attr('cx', (s, i) => toPx(data.coords[i])[0])
      .attr('cy', (s, i) => toPx(data.coords[i])[1])
      .attr('r', data.states.length > 800 ? 3 : 5)
      .style('fill', T.node)
      .style('stroke', 'rgba(0,0,0,0.4)').style('stroke-width', 2);

    if (opts.showLabels && data.states.length <= LABEL_LIMIT) {
      svg.selectAll('text.lbl').data(data.states).enter()
        .append('text').attr('class', 'lbl')
        .attr('x', (s, i) => toPx(data.coords[i])[0])
        .attr('y', (s, i) => toPx(data.coords[i])[1] - 16)
        .attr('text-anchor', 'middle')
        .style('fill', T.text).style('font-size', '16px')
        .text(s => s.join(''));
    }

    if (opts.showPath && data.adj && opts.start !== undefined && opts.end !== undefined) {
      const path = G.HanoiCore.shortestPath(data.adj, opts.start, opts.end);
      for (let k = 0; k < path.length - 1; k++) {
        const p1 = toPx(data.coords[path[k]]), p2 = toPx(data.coords[path[k + 1]]);
        svg.append('line')
          .attr('x1', p1[0]).attr('y1', p1[1])
          .attr('x2', p2[0]).attr('y2', p2[1])
          .style('stroke', '#ff4040').style('stroke-width', 6)
          .style('opacity', 0.9);
      }
      const ends = [path[0], path[path.length - 1]];
      svg.selectAll('circle.path-end').data(ends).enter()
        .append('circle').attr('class', 'path-end')
        .attr('cx', (d, i) => toPx(data.coords[ends[i]])[0])
        .attr('cy', (d, i) => toPx(data.coords[ends[i]])[1])
        .attr('r', 18).style('fill', 'none').style('stroke', '#ff4040').style('stroke-width', 4);
    }
  }

  return { renderGraph, clearGraph, showMessage };
});