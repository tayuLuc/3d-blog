import { bus } from '../core/bus.js';

const CFG = { max: 96, drain: 12, focusDrain: 2.6, reward: 26, punish: 18, lowAt: 22 };

let tokens = CFG.max, drift = 0, exhausted = false;

function publish() {
  bus.emit('tokens:change', { tokens, max: CFG.max, low: tokens < CFG.lowAt, exhausted });
}
function hitZero() {
  if (!exhausted) { exhausted = true; bus.emit('tokens:empty'); }
}

export const economy = {
  setDrift(v) { drift = v; },
  tick(dt) {
    if (drift) {
      tokens = Math.max(0, Math.min(CFG.max, tokens + drift * dt));
      if (tokens === 0) hitZero();
    }
    publish();
  },
  drain(amount) {
    if (exhausted) return 0;
    const d = Math.min(tokens, amount);
    tokens -= d;
    if (tokens <= 0) { tokens = 0; hitZero(); }
    publish();
    return d;
  },
  drainRate: focus => CFG.drain * (focus ? CFG.focusDrain : 1),
  punish(n = CFG.punish) {
    tokens = Math.max(0, tokens - n);
    if (tokens === 0) hitZero();
    publish();
  },
  reward(n = CFG.reward) { tokens = Math.min(CFG.max, tokens + n); publish(); },
  refill() { tokens = CFG.max; exhausted = false; publish(); },
  isExhausted: () => exhausted,
  snapshot() { return { tokens, max: CFG.max, low: tokens < CFG.lowAt, exhausted }; },
};
