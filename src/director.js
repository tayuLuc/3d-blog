import * as THREE from 'three';
import { bus } from './core/bus.js';

const SEC_LEVEL = { room: 0, slot: 0, token: 0, tray: 0, walls: 1, ring: 1, steps: 1, entropy: 1 };

const POSES = {
  room:    { pos: [0, 1.9, 4.6],     look: [0, 2.0, -5.9] },
  slot:    { pos: [-0.6, 2.3, -1.6], look: [-2.2, 2.45, -5.9] },
  token:   { pos: [0.4, 1.7, -0.4],  look: [-0.55, 1.8, -3.3] },
  tray:    { pos: [1.0, 1.5, -1.8],  look: [2.2, 1.15, -5.9] },
  walls:   { pos: [0, 3.3, 5.2],     look: [0, 1.2, -2] },
  ring:    { orbit: { r: 4.6, y: 2.7, speed: .12 } },
  steps:   { orbit: { r: 3.6, y: 2.0, speed: .22 } },
  entropy: { pos: [0, 1.9, 3.4],     look: [0, 1.7, -1] },
};
const RING_CENTER = new THREE.Vector3(0, 1.7, -1);
const SPAWN = { pos: [0, 1.65, 4.3], look: [0, 1.6, -6] };

export function createDirector({ room, loop, capsule, camera, progress }) {
  let mode = 'split';
  let section = 'room';
  const cur = { pos: camera.position.clone(), look: new THREE.Vector3(0, 1.8, -4) };
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();

  function apply() {
    const lvl = mode === '3d' ? progress.get() : (SEC_LEVEL[section] ?? 0);
    const open = lvl >= 1;
    room.setOpen(open);
    if (open) loop.show(); else loop.hide();
    loop.setDemo(mode !== '3d' && open);
    capsule.setDemo(mode !== '3d');
    capsule.setActive(mode === '3d' || !open);
  }

  function setMode(m) {
    mode = m;
    if (m === '3d') {
      camera.position.set(...SPAWN.pos);
      camera.lookAt(...SPAWN.look);
      cur.pos.copy(camera.position);
      cur.look.set(...SPAWN.look);
      loop.reset();
      capsule.setActive(false);
    } else {
      cur.pos.copy(camera.position);
      camera.getWorldDirection(tLook);
      cur.look.copy(camera.position).addScaledVector(tLook, 4);
    }
    apply();
  }

  function setSection(s) {
    if (s === section) return;
    section = s;
    apply();
  }

  function update(dt, t) {
    if (mode !== 'split') return;
    const pose = POSES[section] ?? POSES.room;
    if (pose.orbit) {
      const { r, y, speed } = pose.orbit;
      const a = t * speed;
      tPos.set(Math.cos(a) * r, y, RING_CENTER.z + Math.sin(a) * r);
      tLook.copy(RING_CENTER);
    } else {
      tPos.set(...pose.pos);
      tLook.set(...pose.look);
    }
    tPos.x += Math.sin(t * .5) * .12;
    tPos.y += Math.sin(t * .74) * .07;
    const k = 1 - Math.exp(-dt * 2.2);
    cur.pos.lerp(tPos, k);
    cur.look.lerp(tLook, k);
    camera.position.copy(cur.pos);
    camera.lookAt(cur.look);
  }

  bus.on('level:unlock', apply);

  return { setMode, setSection, update, apply };
}
