import { bus } from '../core/bus.js';

const CFG = {
  max: 96, regen: 9,
  drain: 12,
  focusDrain: 2.6,
  solveReward: 48,
  lowAt: 18, recoverAt: 30,
};

let tokens = CFG.max;
let solved = 0;
let exhausted = false;

function publish() {
  bus.emit('tokens:change', { tokens, max: CFG.max, low: tokens < CFG.lowAt, exhausted });
}

export const economy = {
  tick(dt) {
    tokens = Math.min(CFG.max, tokens + CFG.regen * dt);
    if (exhausted && tokens >= CFG.recoverAt) exhausted = false;
    publish();
  },
  drain(amount) {
    if (exhausted) return 0;
    const d = Math.min(tokens, amount);
    tokens -= d;
    if (tokens <= 0) { tokens = 0; exhausted = true; bus.emit('tokens:empty'); }
    publish();
    return d;
  },
  drainRate: focus => CFG.drain * (focus ? CFG.focusDrain : 1),
  isExhausted: () => exhausted,
  reward() { tokens = Math.min(CFG.max, tokens + CFG.solveReward); publish(); },
  addSolved() { solved++; bus.emit('score:change', { solved }); },
  snapshot() { return { tokens, max: CFG.max, low: tokens < CFG.lowAt, exhausted, solved }; },
};
