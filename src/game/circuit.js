import { bus } from '../core/bus.js';
import { economy } from './economy.js';

const CFG = { orbDelay: 2.0, flowPause: .3, perShift: 5, drift: -1.2 };

export function createCircuit({ voidEnv, nodes, orbs, getLevel }) {
  let active = false, solved = 0, orbTimer = 0, flowing = false;

  function start() { active = true; solved = 0; orbTimer = 1.0; flowing = false; economy.setDrift(CFG.drift); economy.refill(); if (getLevel() >= 1) nodes.spawn(); }
  function stop() { active = false; economy.setDrift(0); orbs.clear(); }

  function spawnOrb() {
    const orb = orbs.spawn(voidEnv.inputPos.clone());
    if (getLevel() >= 1 && nodes.isComplete()) {
      setTimeout(() => {
        const path = nodes.flowPath();
        if (path && orb.g.parent) orbs.startFlow(orb, [voidEnv.inputPos.clone(), ...path, voidEnv.outputPos.clone()]);
      }, 600);
    }
  }

  function update(dt) {
    if (!active) return;
    if (!orbs.waiting() && !orbs.carried() && !flowing) {
      orbTimer -= dt; if (orbTimer <= 0) { orbTimer = CFG.orbDelay; spawnOrb(); }
    }
  }

  bus.on('orb:delivered', () => {
    if (!active) return; solved++; flowing = false; economy.reward();
    bus.emit('score:change', { solved });
    bus.emit('toast', `ОТВЕТ ОТПРАВЛЕН · ${solved}/${CFG.perShift}`);
    voidEnv.outputPort.mat.emissiveIntensity = 3;
    if (solved >= CFG.perShift) {
      bus.emit('toast', 'СМЕНА ЗАВЕРШЕНА'); bus.emit('shift:complete');
      active = false; economy.setDrift(0);
      setTimeout(() => { active = true; solved = 0; orbTimer = 1.5; }, 2500);
    }
  });
  bus.on('orb:node', ({ seg }) => { nodes.pulseNode(seg, 1); const a = nodes.getArcs(); if (a[seg]) a[seg].mat.emissiveIntensity = 2.2; });
  bus.on('circuit:complete', () => { bus.emit('toast', 'ЦЕПЬ ЗАМКНУТА — СФЕРЫ ТЕКУТ САМИ'); bus.emit('noise:spike', { power: .4 }); });

  return { start, stop, update, isActive: () => active };
}
