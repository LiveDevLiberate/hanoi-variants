/* app.js — 应用逻辑 (UMD): 所有变体单页展示, 中英双语切换 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HanoiApp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const I18N = {
    zh: {
      pageTitle: '汉诺塔 — 众神的三角谜团',
      headerTitle: '汉诺塔',
      headerSub: '众神的三角谜团',
      papersTitle: '参考文献',
      link: ' [链接]',
      statesLabel: '状态数',
      edgesLabel: '边数',
      labelToggle: ' 标签',
      pathToggle: ' 最短路径',
      langName: '中文',
      langSwitchTo: 'EN',
      footerNote: '版权原因，无法使用《众神的三角力量》音乐 :/，但是你可以自己播放 :D，Enjoy!',
      legend: '图例：',
      nodeTip: { state: '状态', index: '索引' },
      reset: '重置',
      exportSVG: '导出 SVG',
      exportPNG: '导出 PNG',
      compareTitle: '变体对比',
      thVariant: '变体',
      thStates: '状态数',
      thEdges: '边数',
      thFormula: '公式',
      legendNode: '状态',
      legendEdge: '移动',
      legendPath: '最短路径',
    },
    en: {
      pageTitle: 'Tower of Hanoi — The Triangle Riddle of the Gods',
      headerTitle: 'Tower of Hanoi',
      headerSub: 'The Triangle Riddle of the Gods',
      papersTitle: 'References',
      link: ' [link]',
      statesLabel: 'states',
      edgesLabel: 'edges',
      labelToggle: ' labels',
      pathToggle: ' shortest path',
      langName: 'English',
      langSwitchTo: '中',
      footerNote: "Due to copyright, we can't use the music from \"The Legend of Zelda: A Link to the Past\" :/ but you can play your own :D, Enjoy!",
      legend: 'Legend: ',
      nodeTip: { state: 'state', index: 'index' },
      reset: 'Reset',
      exportSVG: 'Export SVG',
      exportPNG: 'Export PNG',
      compareTitle: 'Variant Comparison',
      thVariant: 'Variant',
      thStates: 'States',
      thEdges: 'Edges',
      thFormula: 'Formula',
      legendNode: 'state',
      legendEdge: 'move',
      legendPath: 'shortest path',
    }
  };

  const PAPERS = [
    { group: { zh: '奠基', en: 'Foundations' }, items: [
      { text: { zh: 'É. Lucas, Récréations Mathématiques vol. III, 1893 — 汉诺塔原始出处',
                en: 'É. Lucas, Récréations Mathématiques vol. III, 1893 — original Hanoi source' } },
      { text: { zh: 'A.M. Hinz et al., The Tower of Hanoi – Myths and Maths, Springer, 2013 — 权威专著',
                en: 'A.M. Hinz et al., The Tower of Hanoi – Myths and Maths, Springer, 2013 — authoritative monograph' } }
    ]},
    { group: { zh: 'Sierpinski 同构', en: 'Sierpinski Isomorphism' }, items: [
      { text: { zh: 'I. Stewart, Le lion, le lama et la laitue, Pour la Science 142, 1989 — 首次提出汉诺塔图 ≅ Sierpinski 垫片',
                en: 'I. Stewart, Le lion, le lama et la laitue, Pour la Science 142, 1989 — first to identify Hanoi graphs ≅ Sierpinski gasket' } },
      { text: { zh: 'A.M. Hinz & A. Schief, The average distance on the Sierpiński gasket, Probab. Theory Related Fields 87, 1990',
                en: 'A.M. Hinz & A. Schief, The average distance on the Sierpiński gasket, Probab. Theory Related Fields 87, 1990' } },
      { text: { zh: 'D. Romik, Shortest paths in the Tower of Hanoi, arXiv:math/0310109',
                en: 'D. Romik, Shortest paths in the Tower of Hanoi, arXiv:math/0310109' },
        url: 'https://arxiv.org/abs/math/0310109' }
    ]},
    { group: { zh: '多柱 / Frame–Stewart', en: 'Multiple Pegs / Frame–Stewart' }, items: [
      { text: { zh: "H.E. Dudeney, The Canterbury Puzzles, 1908 — 4柱问题 (Reve's Puzzle)",
                en: "H.E. Dudeney, The Canterbury Puzzles, 1908 — the four-peg problem (Reve's Puzzle)" } },
      { text: { zh: 'J.S. Frame & B.M. Stewart, Amer. Math. Monthly 48, 1941 — Frame–Stewart 算法',
                en: 'J.S. Frame & B.M. Stewart, Amer. Math. Monthly 48, 1941 — Frame–Stewart algorithm' } },
      { text: { zh: 'X. Chen & J. Shen, On the Frame–Stewart conjecture, SIAM J. Comput. 33, 2004',
                en: 'X. Chen & J. Shen, On the Frame–Stewart conjecture, SIAM J. Comput. 33, 2004' },
        url: 'https://doi.org/10.1137/S0097539703431019' },
      { text: { zh: 'T. Bousch, La quatrième tour de Hanoï, Bull. Belg. Math. Soc. 21, 2014 — 证明4柱情形',
                en: 'T. Bousch, La quatrième tour de Hanoï, Bull. Belg. Math. Soc. 21, 2014 — proves the 4-peg case' },
        url: 'https://doi.org/10.36045/bbms/1420071861' }
    ]},
    { group: { zh: '图结构', en: 'Graph Structure' }, items: [
      { text: { zh: 'S. Klavžar, U. Milutinović, C. Petr, On the Frame-Stewart algorithm, Discrete Appl. Math. 120, 2002',
                en: 'S. Klavžar, U. Milutinović, C. Petr, On the Frame-Stewart algorithm, Discrete Appl. Math. 120, 2002' } },
      { text: { zh: 'P.K. Stockmeyer, Variations on the four-post Tower of Hanoi, Congr. Numer. 102, 1994',
                en: 'P.K. Stockmeyer, Variations on the four-post Tower of Hanoi, Congr. Numer. 102, 1994' } },
      { text: { zh: 'Aumann, Götz, Hinz, Petr, The number of moves of the largest disc in shortest paths on Hanoi graphs, Electron. J. Combin. 21, 2014',
                en: 'Aumann, Götz, Hinz, Petr, The number of moves of the largest disc in shortest paths on Hanoi graphs, Electron. J. Combin. 21, 2014' },
        url: 'https://www.combinatorics.org/ojs/index.php/eljc/article/view/v21i4p38' }
    ]}
  ];

  const state = {};
  let lang = 'zh';

  function t(obj) { return (obj && typeof obj === 'object') ? (obj[lang] || obj.zh || '') : obj; }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = I18N[lang].pageTitle;
    document.getElementById('hanoi-title').textContent = I18N[lang].headerTitle;
    document.getElementById('hanoi-sub').textContent = I18N[lang].headerSub;
    document.getElementById('lang-btn').textContent = I18N[lang].langSwitchTo;
    document.getElementById('lang-name').textContent = I18N[lang].langName;
    const fn = document.getElementById('footer-note');
    if (fn) fn.textContent = I18N[lang].footerNote;
    const container = document.getElementById('variants');
    container.innerHTML = '';
    renderNav();
    HanoiVariants.forEach(v => container.appendChild(buildVariantBlock(v)));
    HanoiVariants.forEach(v => buildVariant(v));
    renderCompare();
    renderPapers();
  }

  function buildParams(v) {
    const p = {};
    v.params.forEach(pp => { p[pp.key] = state[v.id].params[pp.key]; });
    return p;
  }

  function renderFormula(latex) {
    if (latex && typeof katex !== 'undefined' && katex.renderToString) {
      try {
        return katex.renderToString(latex, { throwOnError: false, displayMode: false });
      } catch (e) { /* fall through */ }
    }
    return latex || '';
  }

  function buildVariant(v) {
    const st = state[v.id];
    st.data = v.build(buildParams(v));
    const svg = document.getElementById('graph-' + v.id);
    const opts = { showLabels: st.showLabels, showPath: st.showPath };
    if (st.data.states.length <= 5000 && st.data.states.length > 0) {
      opts.start = 0;
      opts.end = st.data.states.length - 1;
    }
    opts.onNodeClick = (s, idx, ev) => showNodeTip(v, s, idx, ev);
    HanoiRender.renderGraph(svg, st.data, opts);
    const f = v.formula(buildParams(v));
    const sEl = document.getElementById('stats-' + v.id);
    sEl.innerHTML =
      `<div>${I18N[lang].statesLabel} = ${st.data.states.length}&nbsp;&nbsp;<span class="formula">${renderFormula(f.states)}</span></div>` +
      `<div>${I18N[lang].edgesLabel} = ${st.data.edges.length}&nbsp;&nbsp;<span class="formula">${renderFormula(f.edges)}</span></div>`;
  }

  function showNodeTip(v, s, idx, ev) {
    const tip = document.getElementById('node-tip-' + v.id);
    if (!tip) return;
    const labels = I18N[lang].nodeTip || { state: '状态', index: '索引' };
    tip.innerHTML = `<b>${labels.state}: ${s.join('')}</b><br>${labels.index}: ${idx}`;
    tip.style.display = 'block';
    const svgRect = document.getElementById('graph-' + v.id).getBoundingClientRect();
    const x = ev.clientX - svgRect.left + 14;
    const y = ev.clientY - svgRect.top - 10;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function exportGraph(v, kind) {
    const svg = document.getElementById('graph-' + v.id);
    if (!svg) return;
    const vb = svg.viewBox.baseVal;
    const w = vb.width, h = vb.height;
    if (kind === 'svg') {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'hanoi-' + v.id + '.svg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = w * scale; canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'hanoi-' + v.id + '.png';
        a.click();
      };
      img.src = url;
    }
  }

  function buildVariantBlock(v) {
    const st = state[v.id] = { params: {}, showLabels: false, showPath: false, data: null };
    v.params.forEach(pp => { st.params[pp.key] = pp.default; });

    const block = document.createElement('section');
    block.className = 'variant-block';
    block.id = 'block-' + v.id;

    const title = document.createElement('h2');
    title.className = 'v-title';
    title.textContent = t(v.name);
    block.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'v-desc';
    desc.textContent = t(v.desc);
    block.appendChild(desc);

    if (v.ref) {
      const m = v.ref.match(/arXiv:([\w.\/-]+)/);
      const ref = document.createElement('p');
      ref.className = 'v-ref';
      if (m) {
        const link = document.createElement('a');
        link.href = 'https://arxiv.org/abs/' + m[1];
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = v.ref;
        ref.appendChild(link);
      } else {
        ref.textContent = v.ref;
      }
      block.appendChild(ref);
    }

    const stats = document.createElement('div');
    stats.className = 'v-stats';
    stats.id = 'stats-' + v.id;
    block.appendChild(stats);

    const legend = document.createElement('div');
    legend.className = 'v-legend';
    legend.innerHTML =
      `<span>${I18N[lang].legend}</span>` +
      `<span class="lg lg-node"></span><span>${I18N[lang].legendNode}</span>` +
      `<span class="lg lg-edge"></span><span>${I18N[lang].legendEdge}</span>` +
      `<span class="lg lg-path"></span><span>${I18N[lang].legendPath}</span>`;
    block.appendChild(legend);

    const ctrl = document.createElement('div');
    ctrl.className = 'v-controls';
    v.params.forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'control';
      const val = st.params[p.key];
      wrap.innerHTML = `<label>${t(p.label)}: <span class="val" id="val-${v.id}-${p.key}">${val}</span></label>
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
    lblWrap.innerHTML = `<label><input type="checkbox" id="chk-labels-${v.id}">${I18N[lang].labelToggle}</label>`;
    lblWrap.querySelector('input').addEventListener('change', e => {
      st.showLabels = e.target.checked;
      buildVariant(v);
    });
    ctrl.appendChild(lblWrap);

    const spWrap = document.createElement('div');
      spWrap.className = 'control';
      spWrap.innerHTML = `<label><input type="checkbox" id="chk-path-${v.id}">${I18N[lang].pathToggle}</label>`;
      spWrap.querySelector('input').addEventListener('change', e => {
        st.showPath = e.target.checked;
        buildVariant(v);
      });
      ctrl.appendChild(spWrap);

    const resetWrap = document.createElement('div');
    resetWrap.className = 'control';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = I18N[lang].reset;
    resetBtn.addEventListener('click', () => {
      v.params.forEach(pp => { st.params[pp.key] = pp.default; });
      v.params.forEach(pp => {
        const inp = document.getElementById(`param-${v.id}-${pp.key}`);
        if (inp) inp.value = pp.default;
        const val = document.getElementById(`val-${v.id}-${pp.key}`);
        if (val) val.textContent = pp.default;
      });
      st.showLabels = false; st.showPath = false;
      const lbl = document.getElementById(`chk-labels-${v.id}`);
      if (lbl) lbl.checked = false;
      const sp = document.getElementById(`chk-path-${v.id}`);
      if (sp) sp.checked = false;
      buildVariant(v);
    });
    resetWrap.appendChild(resetBtn);
    ctrl.appendChild(resetWrap);

    const expWrap = document.createElement('div');
    expWrap.className = 'control exp-controls';
    const svgBtn = document.createElement('button');
    svgBtn.type = 'button'; svgBtn.className = 'reset-btn';
    svgBtn.textContent = I18N[lang].exportSVG;
    svgBtn.addEventListener('click', () => exportGraph(v, 'svg'));
    const pngBtn = document.createElement('button');
    pngBtn.type = 'button'; pngBtn.className = 'reset-btn';
    pngBtn.textContent = I18N[lang].exportPNG;
    pngBtn.addEventListener('click', () => exportGraph(v, 'png'));
    expWrap.appendChild(svgBtn); expWrap.appendChild(pngBtn);
    ctrl.appendChild(expWrap);
    block.appendChild(ctrl);

    const gc = document.createElement('div');
    gc.className = 'v-graph-container';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'graph-' + v.id;
    svg.setAttribute('class', 'v-graph');
    gc.appendChild(svg);
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.id = 'node-tip-' + v.id;
    gc.appendChild(tip);
    block.appendChild(gc);

    return block;
  }

  function renderNav() {
    const nav = document.getElementById('section-nav');
    nav.innerHTML = '';
    HanoiVariants.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nav-btn';
      b.textContent = t(v.name);
      b.addEventListener('click', () => {
        const el = document.getElementById('block-' + v.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.appendChild(b);
    });
  }

  function renderCompare() {
    const sec = document.getElementById('compare');
    if (!sec) return;
    sec.innerHTML = '<h2>' + I18N[lang].compareTitle + '</h2>';
    const table = document.createElement('table');
    table.className = 'compare-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>${I18N[lang].thVariant}</th><th>${I18N[lang].thStates}</th><th>${I18N[lang].thEdges}</th><th>${I18N[lang].thFormula}</th></tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    HanoiVariants.forEach(v => {
      const p = {};
      v.params.forEach(pp => { p[pp.key] = pp.default; });
      let d = null;
      try { d = v.build(p); } catch (e) { /* skip */ }
      const f = v.formula(p);
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${t(v.name)}</td>` +
        `<td>${d ? d.states.length : '-'}</td>` +
        `<td>${d ? d.edges.length : '-'}</td>` +
        `<td class="cmp-formula"><span class="formula">${renderFormula(f.states)}</span> · <span class="formula">${renderFormula(f.edges)}</span></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    sec.appendChild(table);
  }

  function renderPapers() {
    const sec = document.getElementById('papers');
    sec.innerHTML = '<h2>' + I18N[lang].papersTitle + '</h2>';
    PAPERS.forEach(g => {
      const h = document.createElement('h3');
      h.textContent = t(g.group);
      sec.appendChild(h);
      g.items.forEach(it => {
        const p = document.createElement('p');
        p.className = 'paper';
        if (it.url) {
          const a = document.createElement('a');
          a.href = it.url; a.target = '_blank'; a.textContent = I18N[lang].link;
          p.textContent = t(it.text); p.appendChild(a);
        } else {
          p.textContent = t(it.text);
        }
        sec.appendChild(p);
      });
    });
  }

  function init() {
    const btn = document.getElementById('lang-btn');
    if (btn) btn.addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));
    const top = document.getElementById('back-top');
    if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    setLang('zh');
  }

  return { init, setLang, getLang: () => lang };
});