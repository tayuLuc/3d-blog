import { bus } from './core/bus.js';

const LVL_TAG = ['УР.0 — ЧЁРНЫЙ ЯЩИК', 'УР.1 — ЦИКЛ АГЕНТА'];
const UNLOCK_SHIFTS = 1;

export function createProgress() {
  const dots = [...document.querySelectorAll('.lvls i')];
  const gate = document.getElementById('gate0');
  const level1 = document.getElementById('level1');
  const lvlTag = document.getElementById('lvlTag');
  let level = Math.min(1, +(localStorage.getItem('bb.level') || 0));
  let solved = 0;

  function paint() {
    dots.forEach((d, i) => d.classList.toggle('on', i <= level));
    lvlTag.textContent = LVL_TAG[level];
    document.body.dataset.level = level;
    if (level >= 1) { gate.classList.add('open'); level1.classList.add('unlocked'); }
  }
  function unlock(n) {
    if (level >= n) return;
    level = n;
    localStorage.setItem('bb.level', n);
    paint();
    bus.emit('level:unlock', { level: n });
    bus.emit('toast', 'УРОВЕНЬ 1 ОТКРЫТ — НОЧНАЯ СМЕНА ПРОДОЛЖАЕТСЯ');
  }

  bus.on('shift:complete', () => {
    solved++;
    if (level === 0 && solved >= UNLOCK_SHIFTS) unlock(1);
  });

  paint();
  return { get: () => level };
}
