import * as THREE from 'three';
import { bus } from '../core/bus.js';
import { economy } from './economy.js';

const CFG = { focusBoost: 1.8, lostDecay: 3 };
const clamp01 = v => Math.max(0, Math.min(1, v));

export function createAttention({ camera, getTargets, getFocus }) {
  const ray = new THREE.Raycaster();
  let current = null, progress = 0, lastLabel = undefined;

  function update(dt) {
    const targets = getTargets();
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    const hit = ray.intersectObjects(targets.map(t => t.mesh).filter(Boolean), false)[0];
    const target = hit ? targets.find(t => t.mesh === hit.object) : null;

    if (target !== current) {
      current = target;
      progress = 0;
      if (current?.kind === 'fizzle') bus.emit('node:fizzle', { index: current.index });
    }

    if (current && current.kind !== 'fizzle') {
      if (!economy.isExhausted()) {
        const focus = getFocus();
        economy.drain(economy.drainRate(focus) * dt);
        progress += (dt * (focus ? CFG.focusBoost : 1)) / current.time;
      } else {
        progress = Math.max(0, progress - dt * CFG.lostDecay);
      }
      if (progress >= 1) {
        const done = current;
        current = null;
        progress = 0;
        bus.emit('charge:complete', { kind: done.kind });
        done.onComplete();
      }
    }

    bus.emit('charge:state', {
      kind: current && current.kind !== 'fizzle' ? current.kind : null,
      progress: clamp01(progress),
      focusing: !!getFocus(),
      exhausted: economy.isExhausted(),
      ref: current?.ref ?? null,
    });

    const label = current?.label ?? null;
    if (label !== lastLabel) {
      lastLabel = label;
      bus.emit('readout', label ? { text: label } : null);
    }
  }

  return { update };
}
