import * as THREE from 'three';
import { nodeTex } from './textures.js';
import { bus } from '../core/bus.js';

const CFG = { radius: 2.3, kickInterval: .35, demoEvery: 1.3, spin: { base: .18, demo: .3, kickBoost: .8 } };
const PHASES = [
  { label: 'НАБЛЮДАЙ', color: '#ffb224' },
  { label: 'ДУМАЙ',    color: '#f2efe4' },
  { label: 'ДЕЙСТВУЙ', color: '#4dd8c7' },
];

export function createLoop({ parent, camera }) {
  const group = new THREE.Group(); group.position.set(0, 1.7, -1); group.scale.setScalar(0); group.visible = false;
  parent.add(group);

  const ringMat = new THREE.MeshStandardMaterial({ color: '#141a20', emissive: '#39424e', emissiveIntensity: .6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(CFG.radius, .02, 8, 96), ringMat);
  ring.rotation.x = Math.PI / 2; group.add(ring);
  const loopLight = new THREE.PointLight('#4dd8c7', 0, 10, 2); group.add(loopLight);

  const nodes = PHASES.map(p => {
    const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: '#1a1d23', emissive: p.color, emissiveIntensity: .5 });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.16), mat);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34), new THREE.MeshBasicMaterial({ map: nodeTex(p.label, p.color), transparent: true }));
    label.position.y = .44; g.add(core, label); group.add(g);
    return { ...p, g, mat, core, label };
  });

  const pulse = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#f2efe4', emissive: '#f2efe4', emissiveIntensity: 2 }));
  pulse.visible = false; group.add(pulse);

  let shownTarget = false, demo = false;
  let spin = 0, speed = CFG.spin.base, phase = 0;
  let kickQueue = 0, kickT = 0, kickGlow = 0, demoT = 0, pulseAnim = null;
  let hlRing = 0, hlSteps = 0;
  const tmp = new THREE.Vector3();
  const angle = i => spin + i * (Math.PI * 2 / 3);

  function show() { shownTarget = true; } function hide() { shownTarget = false; }
  function setDemo(v) { demo = v; demoT = 0; }
  function kick(n = 1) { kickQueue += n; }

  function doKick() { pulseAnim = { from: phase, t: 0 }; phase = (phase + 1) % 3; kickGlow = 1; }

  function updatePulse(dt) {
    if (!pulseAnim) { pulse.visible = false; return; }
    pulseAnim.t += dt / .45;
    const a = angle(pulseAnim.from) + (Math.PI * 2 / 3) * (1 - Math.pow(1 - Math.min(1, pulseAnim.t), 3));
    pulse.position.set(Math.cos(a) * CFG.radius, 0, Math.sin(a) * CFG.radius);
    pulse.visible = true; if (pulseAnim.t >= 1) pulseAnim = null;
  }

  function update(dt, t, activeHL) {
    if (shownTarget || group.visible) {
      const s = group.scale.x + ((shownTarget ? 1 : 0) - group.scale.x) * Math.min(1, dt * 2.5);
      group.scale.setScalar(s); group.visible = s > .02; if (!group.visible) return;
    } else return;

    hlRing += ((activeHL === 'ring' ? 1 : 0) - hlRing) * Math.min(1, dt * 5);
    hlSteps += ((activeHL === 'steps' ? 1 : 0) - hlSteps) * Math.min(1, dt * 5);
    const glow = Math.sin(t * 3.6) * .5 + .5;
    const target = (demo ? CFG.spin.demo : CFG.spin.base) + kickQueue * CFG.spin.kickBoost;
    speed += (target - speed) * Math.min(1, dt * 2);
    spin += speed * dt;
    kickGlow = Math.max(0, kickGlow - dt * 1.5);

    camera.getWorldPosition(tmp);
    nodes.forEach((n, i) => {
      const a = angle(i); n.g.position.set(Math.cos(a) * CFG.radius, 0, Math.sin(a) * CFG.radius);
      n.label.lookAt(tmp); n.core.rotation.y += dt * 1.2;
      const isNext = i === phase;
      const want = (isNext ? 1.1 + (Math.sin(t * 4) * .5 + .5) * .7 : .45) + hlSteps * glow * 1.4 + kickGlow * 1.2;
      n.mat.emissiveIntensity += (want - n.mat.emissiveIntensity) * Math.min(1, dt * 8);
      n.core.scale.setScalar(n.core.scale.x + ((isNext ? 1.15 : 1) - n.core.scale.x) * Math.min(1, dt * 8));
    });
    ringMat.emissiveIntensity = .5 + kickGlow * .6 + hlRing * glow * 1.3;
    loopLight.intensity = group.scale.x * (5 + hlRing * 12 + kickGlow * 14);
    updatePulse(dt);

    if (kickQueue > 0) { kickT += dt; if (kickT > CFG.kickInterval) { kickT = 0; kickQueue--; doKick(); } }
    if (demo) { demoT += dt; if (demoT > CFG.demoEvery) { demoT = 0; doKick(); } }
  }

  return { show, hide, setDemo, update, kick };
}
