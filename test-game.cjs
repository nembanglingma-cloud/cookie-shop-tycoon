const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
function game(saved, reduced = false) {
  let now = 0, sequence = 0, tasks = [], value = saved && JSON.stringify(saved);
  const elements = {};
  function element() {
    return { value: '', children: [], handlers: {}, style: { setProperty() {} },
      classList: { toggle() {}, add() {}, remove() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; },
      checkValidity() { return true; }, appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; }, remove() {} };
  }
  function get(id) {
    assert(ids.has(id), `Missing HTML element: ${id}`);
    return elements[id] ||= element();
  }
  Object.entries({ variety: 'classic', quantity: '80', price: '2.00', advertising: '10' }).forEach(([id, v]) => get(id).value = v);
  const math = Object.create(Math); math.random = () => .5;
  vm.runInNewContext(source, {
    document: { getElementById: get, createElement: element }, Math: math,
    window: { matchMedia: () => ({ matches: reduced }) },
    localStorage: { getItem: () => value, setItem: (_, v) => value = v, removeItem: () => value = undefined },
    setTimeout(fn, delay) { const id = ++sequence; tasks.push({ id, at: now + delay, fn }); return id; },
    clearTimeout(id) { tasks = tasks.filter(t => t.id !== id); },
    confirm: () => true, location: { reload() {} }
  });
  return { get, state: () => value && JSON.parse(value),
    select(id) { get('variety').value = id; get('variety').handlers.change(); },
    play() { get('plan').handlers.submit({ preventDefault() {} }); },
    skip() { get('skip-animation').handlers.click(); },
    flush() { while (tasks.length) { tasks.sort((a, b) => a.at - b.at); const task = tasks.shift(); now = task.at; task.fn(); } }
  };
}
for (const [id, unitCost, price] of [['classic', .5, 2], ['oatmeal', .65, 2.5], ['double', .9, 3.25]]) {
  const g = game(); g.select(id);
  assert.equal(Number(g.get('price').value), price);
  g.play(); assert(g.get('variety').disabled); g.play();
  assert.equal(g.state().history.length, 1, 'Cannot start two days during animation');
  g.flush();
  const s = g.state(), r = s.history[0];
  assert.equal(r.variety, id); assert.equal(r.unitCost, unitCost);
  assert.equal(r.expenses, Math.round((80 * unitCost + 15) * 100) / 100);
  assert.equal(r.revenue, r.sold * price);
  assert.equal(r.profit, r.revenue - r.expenses);
  assert.equal(s.cash, 100 + r.profit);
  assert(!g.get('variety').disabled); assert(g.get('skip-animation').hidden);
  assert.equal(g.get('customers').children.length, 0);
  const resumed = game(s); assert.equal(resumed.get('variety').value, id);
  assert.equal(Number(resumed.get('price').value), price);
  assert(resumed.get('ledger').innerHTML.includes(id === 'double' ? 'Double chocolate' : id === 'oatmeal' ? 'Oatmeal cinnamon' : 'Chocolate chip'));
}
const budget = game(); budget.select('double'); budget.get('quantity').value = '200';
budget.get('plan').handlers.input(); assert(budget.get('bake').disabled); budget.play(); assert.equal(budget.state(), undefined);
const legacy = game({ cash: 110, history: [{ day: 1, quantity: 10, sold: 10, price: 2, revenue: 20, expenses: 10, profit: 10, cash: 110 }] });
assert.equal(legacy.get('variety').value, 'classic'); assert(legacy.get('ledger').innerHTML.includes('Chocolate chip'));
const full = game();
for (let day = 0; day < 30; day++) { full.select(['classic', 'oatmeal', 'double'][day % 3]); full.play(); full.skip(); full.flush(); }
assert.equal(full.state().history.length, 30); assert(full.get('bake').disabled); assert(full.get('variety').disabled);
full.play(); assert.equal(full.state().history.length, 30);
const zero = game(); zero.get('quantity').value = '0'; zero.play(); zero.flush(); assert.equal(zero.state().history[0].sold, 0);
const motion = game(undefined, true); motion.play(); motion.flush(); assert(motion.get('skip-animation').hidden);
const reset = game(full.state()); reset.get('restart').handlers.click(); assert.equal(reset.state(), undefined);
assert(game({cash: 4, history: []}).get('bake').disabled);
console.log('PASS: HTML hooks, all varieties, accounting, budgets, animation/skip, saves/legacy, reset, reduced motion, closure, full 30-day run.');
