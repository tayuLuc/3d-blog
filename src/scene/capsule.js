import * as THREE from 'three';
import { labelTex } from './textures.js';
import { clamp, easeOut, easeIn } from '../utils.js';

const TASKS = [
  ['Сколько будет 7 × 8?', '56'],
  ['Напиши хокку про токены', 'контекст на исходе — последний токен дописан, тишина'],
  ['Придумай пароль для робота', 'beep-boop-42!'],
  ['Что тяжелее: кг гвоздей или кг токенов?', 'кг есть кг'],
  ['Сократи «чёрный ящик»', 'ЧЯ'],
  ['Ты живой?', 'нет. но мигаю уверенно'],
];

export function createCapsule({ scene, anchors, onSolved }) {
  const { SLOT, HOVER, TRAY } = anchors;
  let capsule = null, nextSpawn = .9, taskIdx = 0, aimed = false;

  function spawn() {
    const [q, a] = TASKS[taskIdx % TASKS.length];
    const g = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.15, .72),
      new THREE.MeshStandardMaterial({ map: labelTex(q), roughness: .85, side: THREE.DoubleSide,
        emissive: '#35322a', emissiveIntensity: .4 }));
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, .72, .035),
      new THREE.MeshStandardMaterial({ color: '#d9d4c4', roughness: .9 }));
    back.position.z = -.02;
    g.add(front, back);
    g.position.copy(SLOT);
    scene.add(g);
    capsule = { g, front, state: 'drop', t: 0, q, a, from: SLOT.clone() };
  }

  function update(dt, t) {
    if (!capsule) {
      nextSpawn -= dt;
      if (nextSpawn <= 0) { spawn(); nextSpawn = 999; }
      return;
    }
    const c = capsule;
    if (c.state === 'drop') {
      c.t += dt / 1.3;
      const e = easeOut(clamp(c.t, 0, 1));
      c.g.position.lerpVectors(SLOT, HOVER, e);
      c.g.rotation.y = .18 * e;
      if (c.t >= 1) c.state = 'idle';
    } else if (c.state === 'idle') {
      c.g.position.y = HOVER.y + Math.sin(t * 2.1) * .045;
      c.g.rotation.y = .18 + Math.sin(t * .8) * .07;
      const s = aimed ? 1.08 : 1;
      c.g.scale.x += (s - c.g.scale.x) * Math.min(1, dt * 10);
      c.g.scale.y = c.g.scale.x;
    } else if (c.state === 'solve') {
      c.t += dt / .65;
      const e = easeIn(clamp(c.t, 0, 1));
      c.g.position.lerpVectors(c.from, TRAY, e);
      c.g.scale.setScalar(Math.max(.001, 1 - e * .85));
      c.g.rotation.y += dt * 4;
      if (c.t >= 1) {
        scene.remove(c.g);
        capsule = null;
        taskIdx++;
        nextSpawn = 1.4;
        onSolved(c.a);
      }
    }
  }

  return {
    update,
    aimMesh: () => (capsule && capsule.state === 'idle') ? capsule.front : null,
    setAimed(b) { aimed = b; },
    question: () => (capsule ? capsule.q : ''),
    trySolve() {
      if (capsule && capsule.state === 'idle') {
        capsule.state = 'solve';
        capsule.t = 0;
        capsule.from = capsule.g.position.clone();
      }
    },
  };
}
