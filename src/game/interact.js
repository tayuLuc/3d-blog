import { bus } from '../core/bus.js';

export function createInteract({ camera, voidEnv, nodes, orbs, circuit, getLevel }) {
  function targets() {
    const list = [];
    if (!circuit.isActive()) return list;
    const lvl = getLevel();
    const w = orbs.waiting();
    const c = orbs.carried();

    if (lvl < 1) {
      if (w) list.push({ kind: 'grab', mesh: w.core, ref: w, time: .6, onComplete: () => orbs.grab(w) });
      if (c) {
        const d = camera.position.distanceTo(voidEnv.outputPos);
        if (d < 8) list.push({ kind: 'deliver', mesh: voidEnv.outputPort.trigger, ref: c, time: .8, onComplete: () => orbs.deliver(c, voidEnv.outputPos) });
      }
    }

    if (lvl >= 1 && nodes.isSpawned()) {
      const ns = nodes.getNodes();
      const peds = nodes.getPedestals();
      const free = ns.find(n => n.placed < 0 && !n._carried);
      if (free) list.push({ kind: 'grab-node', mesh: free.core, ref: free, time: .5, onComplete: () => { free._carried = true; } });
      const cn = ns.find(n => n._carried);
      if (cn) {
        peds.forEach((p, i) => {
          if (p.occupied >= 0) return;
          const d = camera.position.distanceTo(p.pos.clone().setY(1.35));
          if (d < 5) list.push({ kind: 'place', mesh: p.ring, ref: { node: cn, ped: i }, time: .5,
            onComplete: () => {
              const ok = nodes.placeNode(ns.indexOf(cn), i);
              cn._carried = false;
              if (!ok) bus.emit('toast', 'ЭТОТ УЗЕЛ СЮДА НЕ ВСТАЁТ');
              else if (nodes.isComplete()) bus.emit('circuit:complete');
            } });
        });
      }
    }
    return list;
  }

  return { targets };
}
