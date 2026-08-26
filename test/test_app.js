/* test_app.js — 集成测试: 模拟浏览器环境验证 app.js 流程 */
const assert = require('assert');

function createElement() {
  const el = {
    style: {}, dataset: {}, classList: { add(){}, remove(){} },
    innerHTML: '', textContent: '', value: '', checked: true,
    children: [],
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, addEventListener() {},
    querySelector() { return { addEventListener(){}, textContent:'', checked:true }; },
  };
  return el;
}
const elements = {};
function getEl(id) {
  if (!elements[id]) elements[id] = createElement();
  return elements[id];
}
// createElementNS 用于 svg
global.document = {
  getElementById: getEl,
  createElement: createElement,
  createElementNS: () => {
    const el = createElement();
    el.setAttribute = () => {};
    return el;
  },
  addEventListener() {},
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

assert.strictEqual(Variants.length, 7);
const ids = Variants.map(v => v.id);
assert.deepStrictEqual(ids,
  ['classic', 'same-disk', 'oneway', 'linear', 'four-peg', 'magnetic', 'forbidden']);

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
      assert.ok(Array.isArray(e) && e.length === 2, `${v.id} edge pair`);
    }
  }
}

// init: 所有变体渲染到同一页面, 每变体有独立 svg
App.init();
for (const v of Variants) {
  const svg = getEl('graph-' + v.id);
  assert.ok(svg, `${v.id} svg 元素存在`);
  const stats = getEl('stats-' + v.id);
  assert.ok(stats.textContent.length > 0, `${v.id} stats 有内容`);
  const lbl = getEl('chk-labels-' + v.id);
  assert.ok(lbl, `${v.id} 标签开关存在`);
}

console.log('✓ test_app 全部通过 (7 变体单页流程 + 坐标无 NaN + 渲染调用)');
