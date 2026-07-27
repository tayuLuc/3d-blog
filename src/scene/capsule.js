import * as THREE from 'three';
import { labelTex, stampTex } from './textures.js';
import { clamp, easeOut, easeIn } from '../utils.js';
import { bus } from '../core/bus.js';

const CFG = {
  firstDelay: .9, respawnDelay: 1.4, dropTime: 1.3, solveTime: .65,
  readChargeScale: .06,
  demo: { readAt: .6, solveAt: 1.8 },
};

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

export function createCapsule({ scene, anchors, getLevel }) {
  const { SLOT, HOVER, TRAY } = anchors;
  const stampTexture = stampTex();
  let capsule = null, spawnIn = CFG.firstDelay, taskIdx = 0;
  let activeFlag = true, demo = false, demoT = 0, readCharge = 0;

  bus.on('cycle:done', trySolve);
  bus.on('charge:state', e => { readCharge = e.kind === 'read' ? e.progress : 0; });

  function spawn() {
    const pool = getLevel() >= 1 ? TASKS_L1 : TASKS_L0;
    const task = pool[taskIdx % pool.length];
    const g = new THREE.Group();
    const frontMat = new THREE.MeshStandardMaterial({ map: labelTex(task.q), roughness: .85,
      side: THREE.DoubleSide, emissive: '#35322a', emissiveIntensity: .4 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.15, .72), frontMat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, .72, .035),
      new THREE.MeshStandardMaterial({ color: '#d9d4c4', roughness: .9 }));
    back.position.z = -.02;
    const stamp = new THREE.Mesh(new THREE.PlaneGeometry(.52, .195),
      new THREE.MeshBasicMaterial({ map: stampTexture, transparent: true }));
    stamp.position.set(.28, .44, .01);
    stamp.visible = false;
    g.add(front, back, stamp);
    g.position.copy(SLOT);
    scene.add(g);
    capsule = { g, front, frontMat, stamp, stampPop: 0, read: false,
      state: 'drop', t: 0, ...task, from: SLOT.clone() };
    bus.emit('task:spawn', { task });
  }

  function update(dt, t) {
    if (!activeFlag) return;
    if (!capsule) { spawnIn -= dt; if (spawnIn <= 0) spawn(); return; }
    const c = capsule;
    if (c.state === 'drop') {
      c.t += dt / CFG.dropTime;
      const e = easeOut(clamp(c.t, 0, 1));
      c.g.position.lerpVectors(SLOT, HOVER, e);
      c.g.rotation.y = .18 * e;
      if (c.t >= 1) c.state = 'idle';
    } else if (c.state === 'idle') {
      c.g.position.y = HOVER.y + Math.sin(t * 2.1) * .045;
      c.g.rotation.y = .18 + Math.sin(t * .8) * .07;
      c.frontMat.emissiveIntensity = .4 + readCharge * 1.1;
      const s = 1 + readCharge * CFG.readChargeScale;
      c.g.scale.x += (s - c.g.scale.x) * Math.min(1, dt * 10);
      c.g.scale.y = c.g.scale.x;
      if (c.read) { c.stampPop += dt; c.stamp.scale.setScalar(1 + Math.max(0, .3 - c.stampPop) * 2); }
      if (demo) {
        demoT += dt;
        if (!c.read && demoT > CFG.demo.readAt) markRead();
        if (c.read && demoT > CFG.demo.solveAt) { demoT = 0; trySolve(); }
      }
    } else if (c.state === 'solve') {
      c.t += dt / CFG.solveTime;
      const e = easeIn(clamp(c.t, 0, 1));
      c.g.position.lerpVectors(c.from, TRAY, e);
      c.g.scale.setScalar(Math.max(.001, 1 - e * .85));
      c.g.rotation.y += dt * 4;
      if (c.t >= 1) {
        scene.remove(c.g); const answer = c.a;
        capsule = null; taskIdx++; spawnIn = CFG.respawnDelay;
        bus.emit('task:solved', { answer });
      }
    }
  }

  function markRead() { if (!capsule || capsule.read) return; capsule.read = true; capsule.stamp.visible = true; capsule.stampPop = 0; }
  function trySolve() { if (capsule && capsule.state === 'idle' && capsule.read) { capsule.state = 'solve'; capsule.t = 0; capsule.from = capsule.g.position.clone(); } }
  function setActive(v) { activeFlag = v; if (!v && capsule) { scene.remove(capsule.g); capsule = null; } if (v && !capsule) spawnIn = CFG.firstDelay; }
  function setDemo(v) { demo = v; demoT = 0; }

  return {
    update, trySolve, setActive, setDemo, markRead,
    isIdle: () => !!capsule && capsule.state === 'idle',
    isRead: () => !!capsule && capsule.read,
    aimMesh: () => (capsule && capsule.state === 'idle') ? capsule.front : null,
    question: () => (capsule ? capsule.q : ''),
  };
}
