import * as THREE from 'three';
import { nodeTex } from './textures.js';
import { clamp, easeOut } from '../utils.js';
import { bus } from '../core/bus.js';

const CFG = {
  radius: 2.3,
  hitRadius: .42,
  enterScale: .6,
  scaleIn: .8,
  pulseTime: .45,
  spin: { idle: .12, active: .3, waiting: .07, waitDelay: 5 },
};

const PHASES = [
  { label: 'НАБЛЮДАЙ', color: '#ffb224' },
  { label: 'ДУМАЙ',    color: '#f2efe4' },
  { label: 'ДЕЙСТВУЙ', color: '#4dd8c7' },
];

export function createLoop({ scene, camera }) {
  const group = new THREE.Group();
  group.position.set(0, 1.7, -1.0);
  group.visible = false;
  scene.add(group);

  const ringMat = new THREE.MeshStandardMaterial({ color: '#141a20', emissive: '#39424e', emissiveIntensity: .6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(CFG.radius, .02, 8, 96), ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const loopLight = new THREE.PointLight('#4dd8c7', 0, 10, 2);
  group.add(loopLight);

  const nodes = PHASES.map(p => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#1a1d23', emissive: p.color, emissiveIntensity: .5 });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.16), mat);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34),
      new THREE.MeshBasicMaterial({ map: nodeTex(p.label, p.color), transparent: true }));
    label.position.y = .44;
    g.add(core, label);
    group.add(g);
    return { ...p, g, mat, core, label, col: new THREE.Color(p.color) };
  });

  const pulse = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#f2efe4', emissive: '#f2efe4', emissiveIntensity: 2 }));
  pulse.visible = false;
  group.add(pulse);

  let shown = false, spin = 0, speed = CFG.spin.idle;
  let phase = 0, stepsDone = 0, taskSteps = 0, active = false, idle = 0;
  let pulseAnim = null;
  const fizzle = [0, 0, 0];
  let hlRing = 0, hlSteps = 0;
  const tmp = new THREE.Vector3();

  const angle = i => spin + i * (Math.PI * 2 / 3);

  function show() {
    if (shown) return;
    shown = true;
    group.visible = true;
    group.scale.setScalar(CFG.enterScale);
  }

  function publishPhase() {
    bus.emit('phase:change', {
      label: PHASES[phase].label, color: PHASES[phase].color,
      done: stepsDone, total: taskSteps,
    });
  }

  function startTask(steps) {
    taskSteps = steps; stepsDone = 0; phase = 0; active = true; idle = 0;
    publishPhase();
  }

  function hitTest(p) {
    if (!shown || !active) return false;
    const local = group.worldToLocal(p.clone());
    for (let i = 0; i < 3; i++) {
      if (local.distanceTo(nodes[i].g.position) < CFG.hitRadius) { onNode(i); return true; }
    }
    return false;
  }

  function onNode(i) {
    if (i !== phase) {
      fizzle[i] = 1;
      bus.emit('toast', 'МИМО ФАЗЫ — СЕЙЧАС: ' + PHASES[phase].label);
      return;
    }
    idle = 0;
    pulseAnim = { from: phase, t: 0 };
    phase = (phase + 1) % 3;
    if (phase === 0) {
      stepsDone++;
      if (stepsDone >= taskSteps) {
        active = false;
        bus.emit('phase:change', null);
        bus.emit('cycle:done');
        return;
      }
    }
    publishPhase();
  }

  function updatePulse(dt) {
    if (!pulseAnim) { pulse.visible = false; return; }
    pulseAnim.t += dt / CFG.pulseTime;
    const a = angle(pulseAnim.from) + (Math.PI * 2 / 3) * easeOut(clamp(pulseAnim.t, 0, 1));
    pulse.position.set(Math.cos(a) * CFG.radius, 0, Math.sin(a) * CFG.radius);
    pulse.visible = true;
    if (pulseAnim.t >= 1) pulseAnim = null;
  }

  function update(dt, t, activeHL) {
    if (!shown) return;
    if (group.scale.x < 1) group.scale.setScalar(Math.min(1, group.scale.x + dt * CFG.scaleIn));

    hlRing  += ((activeHL === 'ring'  ? 1 : 0) - hlRing)  * Math.min(1, dt * 5);
    hlSteps += ((activeHL === 'steps' ? 1 : 0) - hlSteps) * Math.min(1, dt * 5);
    const glow = Math.sin(t * 3.6) * .5 + .5;

    idle += dt;
    const target = active
      ? (idle > CFG.spin.waitDelay ? CFG.spin.waiting : CFG.spin.active)
      : CFG.spin.idle;
    speed += (target - speed) * Math.min(1, dt * 2);
    spin += speed * dt;

    camera.getWorldPosition(tmp);
    nodes.forEach((n, i) => {
      const a = angle(i);
      n.g.position.set(Math.cos(a) * CFG.radius, 0, Math.sin(a) * CFG.radius);
      n.label.lookAt(tmp);
      n.core.rotation.y += dt * 1.2;

      const isActive = active && i === phase;
      const want = (isActive ? 1.7 : .5)
        + (isActive ? (Math.sin(t * 5) * .5 + .5) * 1.5 : 0)
        + hlSteps * glow * 1.4
        + fizzle[i] * 2.5;
      n.mat.emissiveIntensity += (want - n.mat.emissiveIntensity) * Math.min(1, dt * 8);
      if (fizzle[i] > 0) {
        n.mat.emissive.set('#ff5c3d');
        fizzle[i] = Math.max(0, fizzle[i] - dt * 3);
        if (fizzle[i] === 0) n.mat.emissive.copy(n.col);
      }
      const s = isActive ? 1.35 : 1;
      n.core.scale.setScalar(n.core.scale.x + (s - n.core.scale.x) * Math.min(1, dt * 8));
    });

    ringMat.emissiveIntensity = .5 + (active ? .25 + Math.sin(t * 2) * .1 : 0) + hlRing * glow * 1.3;
    const assembled = (group.scale.x - CFG.enterScale) / (1 - CFG.enterScale);
    loopLight.intensity = assembled * (6 + hlRing * 12);
    updatePulse(dt);
  }

  return { show, update, hitTest, startTask, isActive: () => active };
}
