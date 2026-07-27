import { bus } from '../core/bus.js';

const CFG = { max: 96, regen: 9, shotCost: 1, solveReward: 48, lowAt: 18 };

let tokens = CFG.max;
let solved = 0;

function publish() {
  bus.emit('tokens:change', { tokens, max: CFG.max, low: tokens < CFG.lowAt });
}

export const economy = {
  tick(dt) { tokens = Math.min(CFG.max, tokens + CFG.regen * dt); publish(); },
  spend() {
    if (tokens < CFG.shotCost) { bus.emit('tokens:empty'); return false; }
    tokens -= CFG.shotCost;
    publish();
    return true;
  },
  reward() { tokens = Math.min(CFG.max, tokens + CFG.solveReward); publish(); },
  addSolved() { solved++; bus.emit('score:change', { solved }); },
  snapshot() { return { tokens, max: CFG.max, low: tokens < CFG.lowAt, solved }; },
};
