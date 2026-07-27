import * as THREE from 'three';
import { bus } from '../core/bus.js';

export function createOrbs({ scene, camera }) {
  const orbs = []; const tmp = new THREE.Vector3();

  function spawn(pos) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#f2efe4', emissive: '#f2efe4', emissiveIntensity: 1.4 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 16), mat);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#f2efe4', transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false }));
    const light = new THREE.PointLight('#f2efe4', 6, 6, 2);
    g.add(core, halo, light); g.position.copy(pos); g.scale.setScalar(.01);
    scene.add(g);
    const orb = { g, core, mat, state: 'appear', t: 0, path: null, seg: 0, segT: 0, carried: false };
    orbs.push(orb); return orb;
  }

  function grab(orb) { if (orb.state !== 'waiting') return; orb.state = 'carried'; orb.carried = true; }
  function deliver(orb, outputPos) { if (orb.state !== 'carried') return; orb.state = 'deliver'; orb.target = outputPos.clone(); orb.t = 0; }
  function startFlow(orb, path) { orb.state = 'flow'; orb.path = path; orb.seg = 0; orb.segT = 0; }

  function update(dt, t) {
    camera.getWorldPosition(tmp);
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i]; o.t += dt;
      if (o.state === 'appear') {
        o.g.scale.setScalar(Math.min(1, o.t * 3));
        if (o.t > .4) { o.state = 'waiting'; o.t = 0; }
      } else if (o.state === 'waiting') {
        o.g.position.y += Math.sin(t * 2.5 + i) * .001; o.core.rotation.y += dt;
        o.mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * .4;
      } else if (o.state === 'carried') {
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
        const target = tmp.clone().addScaledVector(dir, 2.2).add(new THREE.Vector3(0, -.3, 0));
        o.g.position.lerp(target, Math.min(1, dt * 8)); o.core.rotation.y += dt * 2;
      } else if (o.state === 'deliver') {
        o.g.position.lerp(o.target, Math.min(1, dt * 4));
        o.g.scale.setScalar(Math.max(.01, 1 - o.t * 1.5));
        if (o.t > .8) { scene.remove(o.g); orbs.splice(i, 1); bus.emit('orb:delivered'); continue; }
      } else if (o.state === 'flow') {
        const p = o.path; if (o.seg >= p.length - 1) { o.state = 'deliver'; o.target = p[p.length-1].clone(); o.t = 0; continue; }
        o.segT += dt * 1.2; const e = Math.min(1, o.segT);
        o.g.position.lerpVectors(p[o.seg], p[o.seg+1], e);
        o.g.position.y += Math.sin(e * Math.PI) * .6;
        o.core.rotation.y += dt * 3;
        if (e >= 1) { bus.emit('orb:node', { seg: o.seg }); o.seg++; o.segT = 0; }
      }
    }
  }

  function clear() { orbs.forEach(o => scene.remove(o.g)); orbs.length = 0; }
  function waiting() { return orbs.find(o => o.state === 'waiting') ?? null; }
  function carried() { return orbs.find(o => o.state === 'carried') ?? null; }

  return { spawn, grab, deliver, startFlow, update, clear, waiting, carried, getOrbs: () => orbs };
}
