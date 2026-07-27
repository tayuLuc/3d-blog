import * as THREE from 'three';
import { bus } from './core/bus.js';

const SEC_LEVEL = { room: 0, slot: 0, token: 0, tray: 0, walls: 1, ring: 1, steps: 1, entropy: 1 };

const POSES = {
  room:    { pos: [0, 2.6, 0.5],    look: [0, 2.2, 10] },
  slot:    { pos: [-1.4, 2.3, 4.6], look: [-2.2, 2.45, 7.1] },
  token:   { pos: [2.2, 2.0, 5.5],  look: [-0.55, 1.8, 9.7] },
  tray:    { pos: [1.5, 1.4, 4.8],  look: [2.2, 1.15, 7.1] },
  walls:   { pos: [0, 5, -3.5],     look: [0, 2, 9] },
  ring:    { orbit: { r: 8, y: 4, speed: .1, cx: 0, cz: 12 } },
  steps:   { orbit: { r: 6, y: 2.8, speed: .18, cx: 0, cz: 12 } },
  entropy: { pos: [0, 2.4, 1.5],    look: [0, 1.7, 12] },
};
const SPAWN = { pos: [0, 1.65, 3.5], look: [0, 1.5, -6] };

export function createDirector({ room, loop, capsule, shift, camera, progress }) {
  let mode = 'split';
  let section = 'room';
  const cur = { pos: camera.position.clone(), look: new THREE.Vector3(0, 1.8, -4) };
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();

  function apply() {
    const game = mode === '3d';
    room.setGlass(!game);
    const lvl = game ? progress.get() : (SEC_LEVEL[section] ?? 0);
    const open = lvl >= 1;
    room.setOpen(open);
    if (open) loop.show(); else loop.hide();
    loop.setDemo(!game && open);
    capsule.setDemo(!game);
    capsule.setActive(!game);
    if (game) shift.start(); else shift.stop();
  }

  function setMode(m) {
    mode = m;
    if (m === '3d') {
      camera.position.set(...SPAWN.pos); camera.lookAt(...SPAWN.look);
      cur.pos.copy(camera.position); cur.look.set(...SPAWN.look);
    } else {
      cur.pos.copy(camera.position); camera.getWorldDirection(tLook);
      cur.look.copy(camera.position).addScaledVector(tLook, 4);
    }
    bus.emit('noise:spike', { power: .5 });
    apply();
  }

  function setSection(s) { if (s === section) return; section = s; apply(); }

  function update(dt, t) {
    if (mode !== 'split') return;
    const pose = POSES[section] ?? POSES.room;
    if (pose.orbit) {
      const { r, y, speed, cx = 0, cz = 0 } = pose.orbit;
      const a = t * speed;
      tPos.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
      tLook.set(cx, 1.7, cz);
    } else {
      tPos.set(...pose.pos); tLook.set(...pose.look);
    }
    tPos.x += Math.sin(t * .5) * .12; tPos.y += Math.sin(t * .74) * .07;
    const k = 1 - Math.exp(-dt * 2.2);
    cur.pos.lerp(tPos, k); cur.look.lerp(tLook, k);
    camera.position.copy(cur.pos); camera.lookAt(cur.look);
  }

  return { setMode, setSection, update, apply };
}
