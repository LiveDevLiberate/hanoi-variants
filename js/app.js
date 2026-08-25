/* app.js — 应用逻辑 (UMD) */
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

  let currentId = 'classic';
  let currentParams = {};
  let currentData = null;

  function renderNav() {
    const nav = document.getElementById('variant-nav');
    nav.innerHTML = '';
    HanoiVariants.forEach(v => {
      const a = document.createElement('a');
      a.textContent = v.name;
      a.dataset.id = v.id;
      if (v.id === currentId) a.classList.add('active');
      a.addEventListener('click', () => selectVariant(v.id));
      nav.appendChild(a);
    });
  }

  function renderControls() {
    const ctrl = document.getElementById('controls');
    ctrl.innerHTML = '';
    const v = HanoiVariants.find(x => x.id === currentId);
    const header = document.getElementById('variant-header');
    const stats = document.getElementById('stats');
    const oldStats = document.getElementById('stats');
    if (oldStats) oldStats.remove();
    header.innerHTML = `<h2>${v.name}</h2><p style="color:#888;font-size:13px">${v.desc}</p>`;

    v.params.forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'control';
      const val = currentParams[p.key] ?? p.default;
      wrap.innerHTML = `<label>${p.label}: <span class="val" id="val-${p.key}">${val}</span></label>
        <input type="range" id="param-${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}">`;
      wrap.querySelector('input').addEventListener('input', e => {
        currentParams[p.key] = Number(e.target.value);
        document.getElementById(`val-${p.key}`).textContent = currentParams[p.key];
        rebuild();
      });
      ctrl.appendChild(wrap);
    });

    const lblWrap = document.createElement('div');
    lblWrap.className = 'control';
    lblWrap.innerHTML = `<label><input type="checkbox" id="chk-labels" checked> 标签</label>`;
    lblWrap.querySelector('input').addEventListener('change', rebuild);
    ctrl.appendChild(lblWrap);

    if (v.shortest) {
      const spWrap = document.createElement('div');
      spWrap.className = 'control';
      spWrap.innerHTML = `<label><input type="checkbox" id="chk-path" checked> 最短路径</label>`;
      spWrap.querySelector('input').addEventListener('change', rebuild);
      ctrl.appendChild(spWrap);
    }
  }

  function buildParams() {
    const v = HanoiVariants.find(x => x.id === currentId);
    const p = {};
    v.params.forEach(pp => { p[pp.key] = currentParams[pp.key] ?? pp.default; });
    return p;
  }

  function rebuild() {
    const v = HanoiVariants.find(x => x.id === currentId);
    const p = buildParams();
    currentData = v.build(p);
    const svg = document.getElementById('graph');
    const showLabels = document.getElementById('chk-labels')?.checked ?? true;
    const showPath = document.getElementById('chk-path')?.checked ?? false;
    const opts = { showLabels, showPath };
    if (v.shortest && currentData.states.length <= 5000) {
      const startS = v.shortest.start, endS = v.shortest.end;
      opts.start = currentData.states.findIndex(s => JSON.stringify(s) === JSON.stringify(startS));
      opts.end = currentData.states.findIndex(s => JSON.stringify(s) === JSON.stringify(endS));
    }
    HanoiRender.renderGraph(svg, currentData, opts);
    updateStats(v, p);
  }

  function updateStats(v, p) {
    const header = document.getElementById('variant-header');
    const old = document.getElementById('stats');
    if (old) old.remove();
    const f = v.formula(p);
    const info = document.createElement('div');
    info.id = 'stats';
    info.style.cssText = 'color:#ffd700;font-size:13px;margin-top:6px;font-style:italic;';
    info.textContent = `状态数 = ${currentData.states.length}（公式 ${f.states}）· 边数 = ${currentData.edges.length}（${f.edges}）`;
    header.appendChild(info);
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

  function selectVariant(id) {
    currentId = id;
    currentParams = {};
    const v = HanoiVariants.find(x => x.id === id);
    v.params.forEach(p => { currentParams[p.key] = p.default; });
    renderNav();
    renderControls();
    rebuild();
  }

  function init() {
    renderPapers();
    selectVariant('classic');
  }

  return { init, selectVariant, rebuild };
});