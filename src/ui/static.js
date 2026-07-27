import { bus } from '../core/bus.js';
import { economy } from '../game/economy.js';

export function createStatic({ gl }) {
  const canvas = document.getElementById('grain');
  const dread = document.getElementById('dread');
  if (!canvas || !dread) return { update() {} };
  const ctx = canvas.getContext('2d');
  const W = 160, H = 90;
  canvas.width = W;
  canvas.height = H;
  const img = ctx.createImageData(W, H);

  let burst = 0, acc = 0;
  bus.on('noise:spike', ({ power = 1 }) => { burst = Math.max(burst, power); });

  function update(dt) {
    const snap = economy.snapshot();
    const noise = 1 - snap.tokens / snap.max;
    burst = Math.max(0, burst - dt * 1.4);
    const level = Math.min(1, noise * .5 + burst);

    acc += dt;
    if (acc > .08) {
      acc = 0;
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    canvas.style.opacity = (.04 + level * .34).toFixed(3);
    dread.style.opacity = (noise * .55 + burst * .3).toFixed(3);
    gl.style.filter = noise > .35
      ? `saturate(${(1 - (noise - .35) * .5).toFixed(2)}) contrast(${(1 + (noise - .35) * .25).toFixed(2)})`
      : '';
  }

  return { update };
}
