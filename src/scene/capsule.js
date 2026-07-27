import * as THREE from 'three';
import { labelTex } from './textures.js';
import { clamp, easeOut, easeIn } from '../utils.js';

const TASKS_L0 = [
  { q: 'Сколько будет 7 × 8?', a: '56' },
  { q: 'Напиши хокку про токены', a: 'контекст на исходе — последний токен дописан, тишина' },
  { q: 'Придумай пароль для робота', a: 'beep-boop-42!' },
  { q: 'Что тяжелее: кг гвоздей или кг токенов?', a: 'кг есть кг' },
  { q: 'Сократи «чёрный ящик»', a: 'ЧЯ' },
  { q: 'Ты живой?', a: 'нет. но мигаю уверенно' },
];
const TASKS_L1 = [
  { q: 'Где дешевле кофе: у ларька или в кафе?', steps: 2, a: 'У ларька: 90 ₽ против 180 ₽' },
  { q: 'Сколько токенов в слове «контекст»?', steps: 1, a: '3 токена: кон-тек-ст' },
  { q: 'Найди ошибку: 2 + 2 × 2 = 6', steps: 2, a: 'Ошибки нет: 2×2=4, +2 = 6' },
  { q: 'Спланируй утро: кофе, душ, почта', steps: 2, a: 'Душ → кофе → почта' },
  { q: 'Ты теперь агент?', steps: 1, a: 'Уже да: кручусь в цикле' },
];

export function createCapsule({ scene, anchors, onSolved, onSpawn, getLevel }) {
  const { SLOT, HOVER, TRAY } = anchors;
  let capsule = null, nextSpawn = .9, taskIdx = 0, aimed = false;

  function spawn() {
    const pool = getLevel() >= 1 ? TASKS_L1 : TASKS_L0;
    const task = pool[taskIdx % pool.length];
    const g = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.15, .72),
      new THREE.MeshStandardMaterial({ map: labelTex(task.q), roughness: .85, side: THREE.DoubleSide,
        emissive: '#35322a', emissiveIntensity: .4 }));
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, .72, .035),
      new THREE.MeshStandardMaterial({ color: '#d9d4c4', roughness: .9 }));
    back.position.z = -.02;
    g.add(front, back);
    g.position.copy(SLOT);
    scene.add(g);
    capsule = { g, front, state: 'drop', t: 0, ...task, from: SLOT.clone() };
    onSpawn && onSpawn(task);
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
      c.g.position.lerpVectors(SLOT, HOVER, easeOut(clamp(c.t, 0, 1)));
      c.g.rotation.y = .18 * easeOut(clamp(c.t, 0, 1));
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
        const ans = c.a;
        capsule = null;
        taskIdx++;
        nextSpawn = 1.4;
        onSolved(ans);
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
