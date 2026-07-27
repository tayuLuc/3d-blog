import * as THREE from 'three';
import { nodeTex } from './textures.js';
import { clamp, easeOut } from '../utils.js';

const PHASES = [
  { label: 'НАБЛЮДАЙ', color: '#ffb224' },
  { label: 'ДУМАЙ',    color: '#f2efe4' },
  { label: 'ДЕЙСТВУЙ', color: '#4dd8c7' },
];

export function createLoop({ scene, camera, hud, onCycleDone }) {
  const group = new THREE.Group();
  group.position.set(0, 1.7, -1.0);
  group.visible = false;
  scene.add(group);

  const ringMat = new THREE.MeshStandardMaterial({ color: '#141a20', emissive: '#39424e', emissiveIntensity: .6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, .02, 8, 96), ringMat);
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

  let shown = false, spin = 0, speed = .12;
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
    group.scale.setScalar(.6);
  }

  function startTask(steps) {
    taskSteps = steps; stepsDone = 0; phase = 0; active = true; idle = 0;
    hud.setPhase(PHASES[0].label, PHASES[0].color, 0, taskSteps);
  }

  function hitTest(p) {
    if (!shown || !active) return false;
    const local = group.worldToLocal(p.clone());
    for (let i = 0; i < 3; i++) {
      if (local.distanceTo(nodes[i].g.position) < .42) { onNode(i); return true; }
    }
    return false;
  }

  function onNode(i) {
    if (i !== phase) {
      fizzle[i] = 1;
      hud.toast('МИМО ФАЗЫ — СЕЙЧАС: ' + PHASES[phase].label);
      return;
    }
    idle = 0;
    pulseAnim = { from: phase, t: 0 };
    phase = (phase + 1) % 3;
    if (phase === 0) {
      stepsDone++;
      if (stepsDone >= taskSteps) {
        active = false;
        hud.setPhase(null);
        onCycleDone();
        return;
      }
    }
    hud.setPhase(PHASES[phase].label, PHASES[phase].color, stepsDone, taskSteps);
  }

  function updatePulse(dt) {
    if (!pulseAnim) { pulse.visible = false; return; }
    pulseAnim.t += dt / .45;
    const a = angle(pulseAnim.from) + (Math.PI * 2 / 3) * easeOut(clamp(pulseAnim.t, 0, 1));
    pulse.position.set(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3);
    pulse.visible = true;
    if (pulseAnim.t >= 1) pulseAnim = null;
  }

  function update(dt, t, activeHL) {
    if (!shown) return;
    if (group.scale.x < 1) group.scale.setScalar(Math.min(1, group.scale.x + dt * .8));

    hlRing  += ((activeHL === 'ring'  ? 1 : 0) - hlRing)  * Math.min(1, dt * 5);
    hlSteps += ((activeHL === 'steps' ? 1 : 0) - hlSteps) * Math.min(1, dt * 5);
    const glow = Math.sin(t * 3.6) * .5 + .5;

    idle += dt;
    const target = active ? (idle > 5 ? .07 : .3) : .12;
    speed += (target - speed) * Math.min(1, dt * 2);
    spin += speed * dt;

    camera.getWorldPosition(tmp);
    nodes.forEach((n, i) => {
      const a = angle(i);
      n.g.position.set(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3);
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
    loopLight.intensity = (group.scale.x - .6) / .4 * (6 + hlRing * 12);
    updatePulse(dt);
  }

  return { show, update, hitTest, startTask, isActive: () => active };
}
