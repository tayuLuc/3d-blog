import * as THREE from 'three';
import { bus } from './core/bus.js';

const SEC_LEVEL = { room: 0, slot: 0, token: 0, tray: 0, walls: 1, ring: 1, steps: 1, entropy: 1 };
const POSES = {
  room:{pos:[0,4.5,-22],look:[0,1,0]},slot:{pos:[0,2.2,-9],look:[0,1.5,-14]},
  token:{pos:[3,2,-8],look:[0,1.5,-12]},tray:{pos:[0,2.2,9],look:[0,1.5,14]},
  walls:{pos:[-6,3.5,-3],look:[0,1.3,0]},ring:{orbit:{r:11,y:4.5,speed:.08,cx:0,cz:0}},
  steps:{orbit:{r:7,y:2.8,speed:.15,cx:0,cz:0}},entropy:{pos:[0,2.5,-6],look:[0,1.3,3]},
};
const SPAWN = { pos: [0, 1.65, -8], look: [0, 1.5, -14] };

export function createDirector({ voidEnv, nodes, circuit, camera, progress }) {
  let mode = 'split', section = 'room';
  const cur = { pos: camera.position.clone(), look: new THREE.Vector3(0, 1.5, -14) };
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();

  function apply() {
    const game = mode === '3d';
    if (game) circuit.start(); else circuit.stop();
    if (game && progress.get() >= 1) nodes.spawn();
  }

  function setMode(m) { mode = m;
    if (m === '3d') { camera.position.set(...SPAWN.pos); camera.lookAt(...SPAWN.look); cur.pos.copy(camera.position); cur.look.set(...SPAWN.look); }
    else { cur.pos.copy(camera.position); camera.getWorldDirection(tLook); cur.look.copy(camera.position).addScaledVector(tLook, 5); }
    bus.emit('noise:spike', { power: .4 }); apply(); }

  function setSection(s) { if (s === section) return; section = s; }

  function update(dt, t) {
    if (mode !== 'split') return; const pose = POSES[section] ?? POSES.room;
    if (pose.orbit) { const { r, y, speed, cx = 0, cz = 0 } = pose.orbit; const a = t * speed; tPos.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); tLook.set(cx, 1.3, cz); }
    else { tPos.set(...pose.pos); tLook.set(...pose.look); }
    tPos.x += Math.sin(t * .4) * .15; tPos.y += Math.sin(t * .6) * .08;
    const k = 1 - Math.exp(-dt * 2.0); cur.pos.lerp(tPos, k); cur.look.lerp(tLook, k);
    camera.position.copy(cur.pos); camera.lookAt(cur.look);
  }

  return { setMode, setSection, update, apply };
}
