import { bus } from '../core/bus.js';
import { economy } from './economy.js';

const CFG = { drift: -1.7, restartAfter: 1.6, nextShiftAfter: 2.4 };

export function createShift({ pages }) {
  let active = false, failing = false, done = 0;

  function start() {
    active = true;
    failing = false;
    economy.setDrift(CFG.drift);
    economy.refill();
    pages.spawnShift();
  }
  function stop() {
    active = false;
    economy.setDrift(0);
    pages.clear();
  }
  function fail() {
    if (!active || failing) return;
    failing = true;
    bus.emit('noise:spike', { power: 1.6 });
    bus.emit('toast', 'КОНТЕКСК ПОПОВНЕНИЙ — НА ВАЛЕДАВЛЕ');
    setTimeout(() => { if (active) start(); }, CFG.restartAfter * 1000);
  }

  bus.on('tokens:empty', fail);
  bus.on('shift:complete', () => {
    done++;
    economy.setDrift(0);
    bus.emit('toast', `СМЕНА ${done} ЗАВЕРШЕНА`);
    setTimeout(() => { if (active) start(); }, CFG.nextShiftAfter * 1000);
  });

  return { start, stop, isActive: () => active && !failing };
}
