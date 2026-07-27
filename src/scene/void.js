import * as THREE from 'three';
import { gridTex } from './textures.js';

export const BOUNDS = { x: 10, zMin: -18, zMax: 18 };
const INPUT_POS = new THREE.Vector3(0, 1.5, -14);
const OUTPUT_POS = new THREE.Vector3(0, 1.5, 14);

function makePort(scene, pos, color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#0b0d10', emissive: color, emissiveIntensity: 1.2 });
  const pillar = new THREE.BoxGeometry(.18, 3.2, .18);
  const l = new THREE.Mesh(pillar, mat); l.position.set(-1.1, 1.6, 0);
  const r = new THREE.Mesh(pillar, mat); r.position.set(1.1, 1.6, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, .18, .18), mat); top.position.y = 3.2;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .06,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  glow.position.y = 1.6;
  const trigger = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4),
    new THREE.MeshBasicMaterial({ visible: false }));
  trigger.position.y = 1.6;
  g.add(l, r, top, glow, trigger);
  g.position.copy(pos);
  scene.add(g);
  const light = new THREE.PointLight(color, 14, 12, 2);
  light.position.copy(pos).add(new THREE.Vector3(0, .5, 0));
  scene.add(light);
  return { g, mat, light, glow, trigger };
}

export function createVoid(scene) {
  const ft = gridTex(); ft.repeat.set(40, 40);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ map: ft, color: '#3a3f47', roughness: .95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.01;
  scene.add(floor);

  scene.fog = new THREE.Fog('#0a0c10', 6, 55);
  scene.background = new THREE.Color('#0a0c10');
  scene.add(new THREE.HemisphereLight('#5a6a7a', '#08090b', .6));
  const fill = new THREE.PointLight('#4a5a6a', 8, 40, 2);
  fill.position.set(0, 8, 0); scene.add(fill);

  const input = makePort(scene, INPUT_POS, '#ffb224');
  const output = makePort(scene, OUTPUT_POS, '#4dd8c7');

  const N = 300, dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    dp[i*3] = (Math.random()*2-1)*30; dp[i*3+1] = .3+Math.random()*6; dp[i*3+2] = (Math.random()*2-1)*30;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#6a7a8a', size: .018, transparent: true, opacity: .4, depthWrite: false }));
  scene.add(dust);

  function update(dt, t) {
    input.mat.emissiveIntensity = 1.2 + Math.sin(t * 2.2) * .3;
    output.mat.emissiveIntensity = 1.2 + Math.sin(t * 2.2 + 2) * .3;
    input.glow.material.opacity = .05 + Math.sin(t * 1.8) * .02;
    output.glow.material.opacity = .05 + Math.sin(t * 1.8 + 2) * .02;
    dust.rotation.y = t * .004;
  }

  return { update, inputPos: INPUT_POS, outputPos: OUTPUT_POS, inputPort: input, outputPort: output, bounds: BOUNDS };
}
