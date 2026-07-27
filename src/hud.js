import { bus } from './core/bus.js';
import { economy } from './game/economy.js';

const $ = s => document.querySelector(s);

export function createHud() {
  const tokFill = $('#tokFill'), tokVal = $('#tokVal'), scoreEl = $('#score'),
        toastEl = $('#toast'), readoutEl = $('#readout'), readoutText = $('#readoutText'),
        hint = $('#hint'), cross = $('#cross'),
        phaseEl = $('#phase'), phaseName = $('#phaseName'), pips = $('#pips'),
        ring = cross?.querySelector('.ring');

  let toastT, dryT = 0, lastTok = -1;

  function paintTokens({ tokens, max, low, exhausted }) {
    const v = Math.floor(tokens);
    if (v !== lastTok) { lastTok = v; tokVal.textContent = `${v} / ${max}`; }
    tokFill.style.width = (tokens / max * 100) + '%';
    tokFill.classList.toggle('low', low);
  }
  function paintScore(solved) {
    scoreEl.textContent = solved;
    scoreEl.classList.remove('pop'); void scoreEl.offsetWidth; scoreEl.classList.add('pop');
    if (solved === 1) hint.style.opacity = 0;
  }
  function showToast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2100);
  }
  function showReadout(payload) {
    if (payload) { readoutText.textContent = payload.text; readoutEl.classList.add('show'); }
    else readoutEl.classList.remove('show');
  }
  function showPhase(p) {
    if (!p) { phaseEl.classList.remove('show'); return; }
    phaseEl.classList.add('show'); phaseName.textContent = p.label; phaseName.style.color = p.color || '';
    pips.innerHTML = '';
    for (let i = 0; i < p.total; i++) { const s = document.createElement('i'); if (i < p.done) s.className = 'done'; pips.appendChild(s); }
  }

  bus.on('tokens:change', paintTokens);
  bus.on('score:change', ({ solved }) => paintScore(solved));
  bus.on('toast', showToast);
  bus.on('readout', showReadout);
  bus.on('phase:change', showPhase);
  bus.on('charge:state', e => {
    const charging = e.progress > 0;
    cross.classList.toggle('charging', charging);
    cross.classList.toggle('exhausted', charging && e.exhausted);
    if (ring) ring.style.setProperty('--p', e.progress);
  });
  bus.on('charge:complete', () => {
    cross.classList.add('done');
    setTimeout(() => cross.classList.remove('done'), 250);
  });
  bus.on('lock:change', ({ locked }) => {
    document.body.classList.toggle('locked', locked);
    if (!locked) cross.classList.remove('charging', 'exhausted');
  });
  bus.on('tokens:empty', () => {
    const n = performance.now();
    if (n - dryT < 1200) return;
    dryT = n;
    showToast('КОНТЕКСК ПОПОВНЕНИЙ — ШУМ ЗАГЛУШАЕТ');
  });

  paintTokens(economy.snapshot());
  scoreEl.textContent = '0';
}
