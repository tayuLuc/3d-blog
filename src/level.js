import { bus } from './core/bus.js';

const LVL_TAG = ['УР.0 — ЧЁРНЫЙ ЯЩИК', 'УР.1 — ЦИКЛ АГЕНТА'];
const UNLOCK_SOLVED = 3;

export function createProgress({ room, loop }) {
  const dots = [...document.querySelectorAll('.lvls i')];
  const gate = document.getElementById('gate0');
  const level1 = document.getElementById('level1');
  const lvlTag = document.getElementById('lvlTag');
  let level = Math.min(1, +(localStorage.getItem('bb.level') || 0));
  let solved = 0;

  function open(n) {
    if (n !== 1) return;
    room.openWalls();
    loop.show();
    gate.classList.add('open');
    level1.classList.add('unlocked');
  }
  function paint() {
    dots.forEach((d, i) => d.classList.toggle('on', i <= level));
    lvlTag.textContent = LVL_TAG[level];
    document.body.dataset.level = level;
  }
  function unlock(n) {
    if (level >= n) return;
    level = n;
    localStorage.setItem('bb.level', n);
    paint();
    open(n);
    bus.emit('level:unlock', { level: n });
    bus.emit('toast', 'УРОВЕНЬ 1 ОТКРЫТ — КОРОБКА РАСКРЫЛАСЬ В ЦИКЛ');
  }

  bus.on('task:solved', () => {
    solved++;
    if (level === 0 && solved >= UNLOCK_SOLVED) unlock(1);
  });

  paint();
  if (level >= 1) open(level);

  return { get: () => level };
}
