const $ = s => document.querySelector(s);
const tokFill = $('#tokFill'), tokVal = $('#tokVal'), scoreEl = $('#score'),
      toastEl = $('#toast'), readoutEl = $('#readout'), readoutText = $('#readoutText'),
      hint = $('#hint'), cross = $('#cross'),
      phaseEl = $('#phase'), phaseName = $('#phaseName'), pips = $('#pips');

let tokens = 96; const TMAX = 96;
let solved = 0, lastTok = -1, toastT, dryT = 0;

function updateTok() {
  const v = Math.floor(tokens);
  if (v !== lastTok) { lastTok = v; tokVal.textContent = v + ' / ' + TMAX; }
  tokFill.style.width = (tokens / TMAX * 100) + '%';
  tokFill.classList.toggle('low', tokens < 18);
}

export function init() { updateTok(); }
export function tick(dt) { tokens = Math.min(TMAX, tokens + 9 * dt); updateTok(); }

export function spendToken() {
  if (tokens < 1) { dryFire(); return false; }
  tokens--; updateTok(); return true;
}
export function addTokens(n) { tokens = Math.min(TMAX, tokens + n); }

export function addScore() {
  solved++;
  scoreEl.textContent = solved;
  scoreEl.classList.remove('pop'); void scoreEl.offsetWidth; scoreEl.classList.add('pop');
  if (solved === 1) hint.style.opacity = 0;
}

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2100);
}

export function readout(text) {
  if (text) { readoutText.textContent = text; readoutEl.classList.add('show'); }
  else readoutEl.classList.remove('show');
}

export function setLocked(b) { document.body.classList.toggle('locked', b); }

export function kickCross() {
  cross.classList.add('fire');
  setTimeout(() => cross.classList.remove('fire'), 90);
}

export function setPhase(label, color, done = 0, total = 0) {
  if (!label) { phaseEl.classList.remove('show'); return; }
  phaseEl.classList.add('show');
  phaseName.textContent = label;
  phaseName.style.color = color || '';
  pips.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const s = document.createElement('i');
    if (i < done) s.className = 'done';
    pips.appendChild(s);
  }
}

function dryFire() {
  const n = performance.now();
  if (n - dryT < 900) return;
  dryT = n;
  toast('КОНТЕКСТ ПУСТ — ЖДИ ПОПОЛНЕНИЯ');
  cross.classList.add('dry');
  setTimeout(() => cross.classList.remove('dry'), 300);
}
