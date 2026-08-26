/* app.js — 应用逻辑 (UMD): 所有变体单页展示 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiApp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PAPERS = [
    { group: '奠基', items: [
      { text: 'É. Lucas, Récréations Mathématiques vol. III, 1893 — 汉诺塔原始出处' },
      { text: 'A.M. Hinz et al., The Tower of Hanoi – Myths and Maths, Springer, 2013 — 权威专著' }
    ]},
    { group: 'Sierpinski 同构', items: [
      { text: 'I. Stewart, Le lion, le lama et la laitue, Pour la Science 142, 1989 — 首次提出汉诺塔图 ≅ Sierpinski 垫片' },
      { text: 'A.M. Hinz & A. Schief, The average distance on the Sierpiński gasket, Probab. Theory Related Fields 87, 1990' },
      { text: 'D. Romik, Shortest paths in the Tower of Hanoi, arXiv:math/0310109',
        url: 'https://arxiv.org/abs/math/0310109' }
    ]},
    { group: '多柱 / Frame–Stewart', items: [
      { text: 'H.E. Dudeney, The Canterbury Puzzles, 1908 — 4柱问题 (Reve\'s Puzzle)' },
      { text: 'J.S. Frame & B.M. Stewart, Amer. Math. Monthly 48, 1941 — Frame–Stewart 算法' },
      { text: 'X. Chen & J. Shen, On the Frame–Stewart conjecture, SIAM J. Comput. 33, 2004',
        url: 'https://doi.org/10.1137/S0097539703431019' },
      { text: 'T. Bousch, La quatrième tour de Hanoï, Bull. Belg. Math. Soc. 21, 2014 — 证明4柱情形',
        url: 'https://doi.org/10.36045/bbms/1420071861' }
    ]},
    { group: '图结构', items: [
      { text: 'S. Klavžar, U. Milutinović, C. Petr, On the Frame-Stewart algorithm, Discrete Appl. Math. 120, 2002' },
      { text: 'P.K. Stockmeyer, Variations on the four-post Tower of Hanoi, Congr. Numer. 102, 1994' },
      { text: 'Aumann, Götz, Hinz, Petr, The number of moves of the largest disc in shortest paths on Hanoi graphs, Electron. J. Combin. 21, 2014',
        url: 'https://www.combinatorics.org/ojs/index.php/eljc/article/view/v21i4p38' }
    ]}
  ];

  const state = {};

  function buildParams(v) {
    const p = {};
    v.params.forEach(pp => { p[pp.key] = state[v.id].params[pp.key]; });
    return p;
  }

  function buildVariant(v) {
    const st = state[v.id];
    st.data = v.build(buildParams(v));
    const svg = document.getElementById('graph-' + v.id);
    const opts = { showLabels: st.showLabels, showPath: st.showPath };
    if (v.shortest && st.data.states.length <= 5000) {
      const startS = v.shortest.start, endS = v.shortest.end;
      opts.start = st.data.states.findIndex(s => JSON.stringify(s) === JSON.stringify(startS));
      opts.end = st.data.states.findIndex(s => JSON.stringify(s) === JSON.stringify(endS));
    }
    HanoiRender.renderGraph(svg, st.data, opts);
    const f = v.formula(buildParams(v));
    document.getElementById('stats-' + v.id).textContent =
      `状态数 = ${st.data.states.length}（公式 ${f.states}）· 边数 = ${st.data.edges.length}（${f.edges}）`;
  }

  function buildVariantBlock(v) {
    const st = state[v.id] = { params: {}, showLabels: true, showPath: !!v.shortest, data: null };
    v.params.forEach(pp => { st.params[pp.key] = pp.default; });

    const block = document.createElement('section');
    block.className = 'variant-block';

    const title = document.createElement('h2');
    title.className = 'v-title';
    title.textContent = v.name;
    block.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'v-desc';
    desc.textContent = v.desc;
    block.appendChild(desc);

    const stats = document.createElement('div');
    stats.className = 'v-stats';
    stats.id = 'stats-' + v.id;
    block.appendChild(stats);

    const ctrl = document.createElement('div');
    ctrl.className = 'v-controls';
    v.params.forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'control';
      const val = st.params[p.key];
      wrap.innerHTML = `<label>${p.label}: <span class="val" id="val-${v.id}-${p.key}">${val}</span></label>
        <input type="range" id="param-${v.id}-${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}">`;
      wrap.querySelector('input').addEventListener('input', e => {
        st.params[p.key] = Number(e.target.value);
        document.getElementById(`val-${v.id}-${p.key}`).textContent = st.params[p.key];
        buildVariant(v);
      });
      ctrl.appendChild(wrap);
    });

    const lblWrap = document.createElement('div');
    lblWrap.className = 'control';
    lblWrap.innerHTML = `<label><input type="checkbox" id="chk-labels-${v.id}" checked> 标签</label>`;
    lblWrap.querySelector('input').addEventListener('change', e => {
      st.showLabels = e.target.checked;
      buildVariant(v);
    });
    ctrl.appendChild(lblWrap);

    if (v.shortest) {
      const spWrap = document.createElement('div');
      spWrap.className = 'control';
      spWrap.innerHTML = `<label><input type="checkbox" id="chk-path-${v.id}" checked> 最短路径</label>`;
      spWrap.querySelector('input').addEventListener('change', e => {
        st.showPath = e.target.checked;
        buildVariant(v);
      });
      ctrl.appendChild(spWrap);
    }
    block.appendChild(ctrl);

    const gc = document.createElement('div');
    gc.className = 'v-graph-container';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'graph-' + v.id;
    svg.setAttribute('class', 'v-graph');
    gc.appendChild(svg);
    block.appendChild(gc);

    return block;
  }

  function renderPapers() {
    const sec = document.getElementById('papers');
    sec.innerHTML = '<h2>参考文献</h2>';
    PAPERS.forEach(g => {
      const h = document.createElement('h3');
      h.textContent = g.group;
      sec.appendChild(h);
      g.items.forEach(it => {
        const p = document.createElement('p');
        p.className = 'paper';
        if (it.url) {
          const a = document.createElement('a');
          a.href = it.url; a.target = '_blank'; a.textContent = ' [链接]';
          p.textContent = it.text; p.appendChild(a);
        } else {
          p.textContent = it.text;
        }
        sec.appendChild(p);
      });
    });
  }

  function init() {
    const container = document.getElementById('variants');
    HanoiVariants.forEach(v => {
      container.appendChild(buildVariantBlock(v));
    });
    HanoiVariants.forEach(v => buildVariant(v));
    renderPapers();
  }

  return { init };
});
