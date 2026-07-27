import { bus } from '../core/bus.js';
import { economy } from './economy.js';

const CFG = { drift: -1.7, perShift: 3, restartAfter: 1.6, nextShiftAfter: 2.4 };

export function createShift({ pages, capsule }) {
  let active = false, failing = false, done = 0, solved = 0;

  function restartChain() { pages.clear(); capsule.setActive(false); capsule.setActive(true); }
  function start() { active = true; failing = false; solved = 0; economy.setDrift(CFG.drift); economy.refill(); restartChain(); }
  function stop() { active = false; economy.setDrift(0); pages.clear(); }
  function fail() {
    if (!active || failing) return;
    failing = true; bus.emit('noise:spike', { power: 1.6 });
    bus.emit('toast', 'КОНТЕКСТ ПЕРЕПОЛНЕН — СМЕНА СБРОШЕНА');
    setTimeout(() => { if (active) start(); }, CFG.restartAfter * 1000);
  }

  bus.on('tokens:empty', fail);
  bus.on('page:solved', () => {
    if (!active) return; solved++;
    bus.emit('score:change', { solved });
    if (solved >= CFG.perShift) {
      economy.setDrift(0);
      bus.emit('toast', `СМЕНА ${++done} ЗАВЕРШЕНА`);
      bus.emit('shift:complete');
      setTimeout(() => { if (active) start(); }, CFG.nextShiftAfter * 1000);
    }
  });

  return { start, stop, isActive: () => active && !failing };
}
