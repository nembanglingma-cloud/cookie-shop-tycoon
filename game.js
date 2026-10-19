(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = n => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const round = n => Math.round(n * 100) / 100;
  const storageKey = 'kevins-cookie-shop-v1';
  const events = [
    { title: 'A fresh start', text: 'A regular day in the neighborhood. A $2 cookie is a good starting point.', demand: 1 },
    { title: 'Market day', text: 'The local market brings extra foot traffic. Expect about 25% more customers.', demand: 1.25 },
    { title: 'Rain in the forecast', text: 'A rainy day keeps some neighbors inside. Expect about 20% less foot traffic.', demand: .8 },
    { title: 'The afternoon rush', text: 'Office workers are looking for a sweet break. Expect about 15% more customers.', demand: 1.15 },
    { title: 'A quiet neighborhood', text: 'A slower day ahead. Expect about 10% less foot traffic.', demand: .9 }
  ];
  let state = { cash: 100, history: [] };
  let playing = false, timers = [];
  const later = (fn, delay) => timers.push(setTimeout(fn, delay));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.cash) && saved.cash >= 0 && Array.isArray(saved.history) && saved.history.length <= 30 && saved.history.every(r => ['day','sold','revenue','expenses','profit','cash'].every(k => Number.isFinite(r[k])))) state = saved;
  } catch (_) { /* A private browser can block local storage. */ }
  const forecast = () => events[state.history.length % events.length];
  const ended = () => state.history.length >= 30 || state.cash < 5;
  function costs() {
    const quantity = Number($('quantity').value);
    const advertising = Number($('advertising').value);
    return { quantity, advertising, ingredients: round(quantity * .5), total: round(quantity * .5 + advertising + 5) };
  }
  function updateCost() {
    const c = costs();
    $('ingredients').textContent = money(c.ingredients);
    $('ad-cost').textContent = money(c.advertising);
    $('cost').textContent = money(c.total);
    $('error').textContent = !ended() && c.total > state.cash ? 'This plan is over budget. Bake fewer cookies or lower your advertising spend.' : '';
    $('bake').disabled = playing || ended() || c.total > state.cash;
  }
  function color(el, value) { el.classList.toggle('positive', value > 0); el.classList.toggle('negative', value < 0); }
  function render() {
    const days = state.history.length;
    const totalProfit = round(state.cash - 100);
    $('cash').textContent = money(state.cash);
    $('total-profit').textContent = money(totalProfit); color($('total-profit'), totalProfit);
    $('total-sold').textContent = state.history.reduce((n, r) => n + r.sold, 0).toLocaleString();
    $('day').innerHTML = `Day ${Math.min(days + 1, 30)} <em>/ 30</em>`;
    $('progress').style.width = `${days / 30 * 100}%`;
    $('forecast-title').textContent = forecast().title;
    $('forecast-text').textContent = forecast().text;
    const last = state.history.at(-1);
    if (last) {
      $('result-label').textContent = `DAY ${last.day} · AFTER CLOSING`;
      $('result-badge').textContent = last.profit >= 0 ? 'A sweet day' : 'Room to grow';
      $('result-title').textContent = last.profit >= 0 ? 'That’s how the cookie earns.' : 'A little room to rise.';
      $('result-message').textContent = `${last.sold} of ${last.quantity} cookies sold. ${last.quantity - last.sold} unsold cookies were donated at closing. ${last.sold === last.quantity && last.quantity > 0 ? 'You sold out! Try a bigger batch tomorrow.' : 'Adjust your batch, price, or advertising for tomorrow.'}`;
      for (const key of ['sold', 'revenue', 'expenses', 'profit']) $('' + key).textContent = key === 'sold' ? last.sold.toLocaleString() : money(last[key]);
      color($('profit'), last.profit);
    }
    $('closing').textContent = money(state.cash);
    if (ended()) {
      $('decision-title').textContent = 'The ovens are resting.';
      $('forecast-title').textContent = days >= 30 ? 'Thirty days, freshly baked.' : 'The shop has closed.';
      $('forecast-text').textContent = days >= 30 ? 'Your 30-day run is complete. Start fresh to try a new strategy.' : 'You need at least $5 to cover daily overhead. Start fresh to try again.';
      $('result-badge').textContent = 'Run complete';
      $('result-title').textContent = days >= 30 ? 'Your first chapter, complete.' : 'Every baker starts somewhere.';
      $('result-message').textContent = `You finished ${days} day${days === 1 ? '' : 's'} with ${money(state.cash)} and ${money(totalProfit)} in total profit. Your final daily results are below.`;
    }
    for (const id of ['quantity', 'price', 'advertising']) $(id).disabled = playing || ended();
    $('ledger').innerHTML = [...state.history].reverse().map(r => `<tr><td>${r.day}</td><td>${r.sold}</td><td>${money(r.revenue)}</td><td>${money(r.expenses)}</td><td class="${r.profit >= 0 ? 'positive' : 'negative'}">${money(r.profit)}</td><td>${money(r.cash)}</td></tr>`).join('');
    $('empty').hidden = days > 0;
    const values = [100, ...state.history.map(r => r.cash)];
    const max = Math.max(...values) * 1.1, min = Math.min(0, ...values);
    const points = values.map((v, i) => `${i / Math.max(1, values.length - 1) * 500},${55 - (v - min) / (max - min) * 45}`).join(' ');
    $('chart').innerHTML = `<svg viewBox="0 0 500 64" preserveAspectRatio="none" role="img" aria-label="Cash over ${days} completed days, now ${money(state.cash)}"><path d="M0 57H500" stroke="#e9e0d4" stroke-dasharray="3 5"/><polyline points="${points}" fill="none" stroke="#b9774e" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
    updateCost();
  }
  function finishDay() {
    timers.forEach(clearTimeout); timers = [];
    playing = false;
    $('customers').replaceChildren();
    $('shop-scene').classList.remove('is-open');
    $('skip-animation').hidden = true;
    const last = state.history.at(-1);
    $('shop-status').textContent = 'Closed for the day';
    $('door-sign').textContent = 'THANK YOU';
    $('shop-caption').textContent = last.sold ? `${last.sold} cookies found a happy home. See you tomorrow!` : 'A quiet day at the counter. Tomorrow is a fresh batch.';
    $('bake').innerHTML = 'Open shop & bake <span>→</span>';
    render();
  }
  function animateDay(day) {
    playing = true;
    updateCost();
    for (const id of ['quantity', 'price', 'advertising']) $(id).disabled = true;
    $('bake').textContent = 'Serving happy neighbors…';
    $('skip-animation').hidden = false;
    $('shop-scene').classList.add('is-open');
    $('door-sign').textContent = 'OPEN';
    $('shop-status').textContent = `Day ${day.day} · Shop is open`;
    $('shop-caption').textContent = 'Doors open! Here come the cookie lovers.';
    // Busy days group cookies into orders to keep the scene short.
    const visitors = Math.min(day.sold, 18);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $('shop-caption').textContent = `${day.sold} cookies served today. Wrapping up…`;
      later(finishDay, 700);
      return;
    }
    let served = 0;
    const shirts = ['#719a85', '#cf795b', '#8196b2', '#b08aa5', '#d0a348'];
    const skins = ['#e2ae84', '#9c6548', '#c98e63', '#f0c7a3'];
    for (let i = 0; i < visitors; i++) {
      const order = Math.floor(day.sold / visitors) + (i < day.sold % visitors ? 1 : 0);
      later(() => {
        const customer = document.createElement('div');
        customer.className = 'customer';
        customer.style.setProperty('--shirt', shirts[i % shirts.length]);
        customer.style.setProperty('--skin', skins[i % skins.length]);
        customer.style.setProperty('--lane', `${i % 3 * 6}px`);
        customer.innerHTML = `<div class="customer-body"><span class="customer-head"></span><span class="customer-shirt"></span><span class="customer-legs"></span><span class="customer-cookie">🍪</span></div><span class="purchase-pop">+${order} 🍪</span>`;
        $('customers').appendChild(customer);
        later(() => {
          served += order;
          $('shop-caption').textContent = `${served} / ${day.sold} cookies served · ${order > 1 ? 'A box of happiness!' : 'One cookie, one happy neighbor!'}`;
        }, 1250);
        later(() => customer.remove(), 2800);
      }, i * 190);
    }
    if (!visitors) $('shop-caption').textContent = 'No cookie orders today. A chance to rethink tomorrow’s recipe.';
    later(finishDay, visitors ? (visitors - 1) * 190 + 2900 : 1800);
  }
  $('skip-animation').addEventListener('click', () => { if (playing) finishDay(); });
  $('plan').addEventListener('input', updateCost);
  $('plan').addEventListener('submit', event => {
    event.preventDefault();
    if (playing || ended() || !$('plan').checkValidity()) return;
    const c = costs(), price = Number($('price').value);
    if (!Number.isInteger(c.quantity) || c.total > state.cash || c.quantity < 0 || c.advertising < 0 || price < .25 || !Number.isFinite(c.total)) return;
    // Advertising has diminishing returns; higher prices reduce demand.
    const demand = Math.max(0, Math.round((55 + 22 * Math.sqrt(c.advertising)) * Math.pow(2 / price, 1.4) * forecast().demand * (.9 + Math.random() * .2)));
    const sold = Math.min(c.quantity, demand), revenue = round(sold * price), profit = round(revenue - c.total);
    state.cash = round(state.cash + profit);
    state.history.push({ day: state.history.length + 1, quantity: c.quantity, sold, price, advertising: c.advertising, revenue, expenses: c.total, profit, cash: state.cash });
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {}
    animateDay(state.history.at(-1));
  });
  $('restart').addEventListener('click', () => {
    if (state.history.length && !confirm('Start a new shop with $100? Your current run will be cleared.')) return;
    state = { cash: 100, history: [] };
    try { localStorage.removeItem(storageKey); } catch (_) {}
    $('quantity').value = 80; $('price').value = '2.00'; $('advertising').value = '10.00';
    location.reload();
  });
  render();
})();
