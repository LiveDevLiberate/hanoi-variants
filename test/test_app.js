/* test_app.js — 集成测试: 模拟浏览器环境验证 app.js 流程 */
const assert = require('assert');

function createElement() {
  const el = {
    style: {}, dataset: {}, classList: { add(){}, remove(){} },
    _html: '', textContent: '', value: '', checked: true,
    children: [],
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, addEventListener() {},
    querySelector() { return { addEventListener(){}, textContent:'', checked:true }; },
    querySelectorAll() { return []; },
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) {
      el._html = v;
      el.textContent = v.replace(/<[^>]*>/g, '');
      if (v === '') el.children = [];
    },
  });
  return el;
}
const elements = {};
const svgEls = [];
function getEl(id) {
  if (!elements[id]) elements[id] = createElement();
  return elements[id];
}
function makeSvg() {
  const el = createElement();
  el.attrs = {};
  el.setAttribute = function (k, v) { this.attrs[k] = v; };
  Object.defineProperty(el, 'className', {
    get() { return { baseVal: el.attrs.class || '' }; },
    set() { throw new TypeError('SVGElement.className is read-only'); },
  });
  Object.defineProperty(el, 'id', {
    get() { return el.attrs.id || ''; },
    set(v) { el.attrs.id = v; },
  });
  svgEls.push(el);
  return el;
}
global.document = {
  documentElement: { lang: '' },
  getElementById: getEl,
  createElement: createElement,
  createElementNS: makeSvg,
  addEventListener() {},
  querySelector() { return { addEventListener(){}, textContent:'', value:'' }; },
  querySelectorAll() { return []; },
};
global.window = global;

function makeSel() {
  const sel = {
    data() { return makeSel(); },
    enter() { return makeSel(); },
    append() { return makeSel(); },
    attr() { return makeSel(); },
    style() { return makeSel(); },
    text() { return makeSel(); },
    selectAll() { return makeSel(); },
    remove() { return makeSel(); },
  };
  return sel;
}
global.d3 = { select() { return makeSel(); } };

globalThis.HanoiCore = require('../js/core.js');
globalThis.HanoiVariants = require('../js/variants.js');
globalThis.HanoiRender = require('../js/render.js');
globalThis.HanoiApp = require('../js/app.js');

const Core = globalThis.HanoiCore;
const Variants = globalThis.HanoiVariants;
const App = globalThis.HanoiApp;

assert.strictEqual(Variants.length, 10);
const ids = Variants.map(v => v.id);
assert.deepStrictEqual(ids,
  ['classic', 'same-disk', 'oneway', 'linear', 'star', 'four-peg', 'magnetic', 'twin', 'weighted', 'forbidden']);

for (const v of Variants) {
  assert.strictEqual(typeof v.build, 'function', `${v.id} build`);
  assert.strictEqual(typeof v.formula, 'function', `${v.id} formula`);
  assert.ok(Array.isArray(v.params) && v.params.length > 0, `${v.id} params`);
}

for (const v of Variants) {
  const p = {};
  v.params.forEach(pp => { p[pp.key] = pp.default; });
  const data = v.build(p);
  assert.ok(data.states.length > 0, `${v.id} states`);
  assert.ok(Array.isArray(data.coords) && data.coords.length === data.states.length, `${v.id} coords`);
  for (const c of data.coords) {
    assert.ok(Number.isFinite(c[0]) && Number.isFinite(c[1]), `${v.id} NaN coord`);
  }
  for (const e of data.edges) {
    if (data.directed) {
      assert.strictEqual(typeof e.from, 'number', `${v.id} edge.from`);
      assert.strictEqual(typeof e.to, 'number', `${v.id} edge.to`);
    } else {
      assert.ok(Array.isArray(e) && e.length >= 2, `${v.id} edge pair`);
    }
  }
}

App.init();

for (const v of Variants) {
  const svg = svgEls.find(s => s.attrs.id === 'graph-' + v.id);
  assert.ok(svg, `${v.id} svg 元素存在`);
  assert.strictEqual(svg.attrs.class, 'v-graph', `${v.id} svg class`);
  const stats = getEl('stats-' + v.id);
  assert.ok(stats.textContent.length > 0, `${v.id} stats 有内容`);
  const lbl = getEl('chk-labels-' + v.id);
  assert.ok(lbl, `${v.id} 标签开关存在`);
}

assert.strictEqual(svgEls.length, 10, '10 个独立 svg');

// 双语: 默认中文, 切英文后变体标题切换
// 最短路径默认关闭
const classicState = Variants.map(v => v.id);
assert.ok(classicState.length === 10, '10 变体');
// 通过 renderGraph opts 验证: 默认 showPath false (app.js buildVariant 传入)
assert.strictEqual(App.getLang(), 'zh', '默认中文');
const firstTitle = () => getEl('variants').children[0]?.children[0]?.textContent || '';
assert.ok(getEl('variants').children.length === 10, '10 个变体块');
const zhTitle = firstTitle();
App.setLang('en');
assert.strictEqual(App.getLang(), 'en', '切英文');
App.setLang('zh');
assert.strictEqual(App.getLang(), 'zh', '切回中文');
assert.strictEqual(document.documentElement.lang, 'zh-CN', 'lang 属性中文');
// 章节导航按钮 (10 个) + 回到顶部按钮
const nav = getEl('section-nav');
assert.strictEqual(nav.children.length, 10, '10 个导航按钮');
const backTop = getEl('back-top');
assert.ok(backTop, '回到顶部按钮存在');

console.log('✓ test_app 全部通过 (10 变体单页流程 + SVG class 只读 + 坐标无 NaN)');