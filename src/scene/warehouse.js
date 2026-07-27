import * as THREE from 'three';
import { gridTex } from './textures.js';

export const WAREHOUSE_BOUNDS = { x: 13, zMin: -13, zMax: 13 };

const RACKS = [
  [-4,-7,0],[2,-5,.4],[-9,-1,.2],[4,-1,-.3],[9,-6,.6],[-3,2,-.5],
  [7,7,.2],[-7,9,-.2],[2,9,.5],[-11,-6,.1],[11,0,-.4],[0,6,.3],
];
const LAMPS = [
  [-2,-2,'#ffb224'],[6,-3,'#4dd8c7'],[-6,4,'#ffb224'],[3,5,'#ffb224'],
];

export function createWarehouse(scene) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const ft = gridTex();
  ft.repeat.set(18, 18);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ map: ft, color: '#565c66', roughness: .95 }));
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const rackMat = new THREE.MeshStandardMaterial({ color: '#11141a', roughness: .8, metalness: .3 });
  const leds = [];
  RACKS.forEach(([x, z, r]) => {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, .9), rackMat);
    rack.position.set(x, 1.7, z);
    rack.rotation.y = r;
    group.add(rack);
    for (let i = 0; i < 2; i++) {
      const warm = Math.random() < .6;
      const led = new THREE.Mesh(new THREE.PlaneGeometry(.9, .05),
        new THREE.MeshStandardMaterial({ color: '#0b0d10',
          emissive: warm ? '#ffb224' : '#4dd8c7', emissiveIntensity: .8 }));
      led.position.set(x + Math.sin(r) * .46, .8 + i * 1.4, z + Math.cos(r) * .46);
      led.rotation.y = r;
      group.add(led);
      if (Math.random() < .5) leds.push({ m: led.material, base: .8,
        f: 3 + Math.random() * 9, ph: Math.random() * 7, blink: Math.random() < .3 });
    }
  });

  const lamps = LAMPS.map(([x, z, c]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: '#171b21', roughness: .6, metalness: .5 }));
    pole.position.set(x, 1.3, z);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.34, .12, .34),
      new THREE.MeshStandardMaterial({ color: '#0b0d10', emissive: c, emissiveIntensity: 1.6 }));
    head.position.set(x, 2.62, z);
    const light = new THREE.PointLight(c, 20, 15, 2);
    light.position.set(x, 2.5, z);
    group.add(pole, head, light);
    return { light, base: 20, f: .7 + Math.random(), ph: Math.random() * 7 };
  });

  const N = 380, dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    dp[i*3] = (Math.random()*2 - 1) * 14;
    dp[i*3+1] = .2 + Math.random() * 4.5;
    dp[i*3+2] = (Math.random()*2 - 1) * 14;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo,
    new THREE.PointsMaterial({ color: '#8b96a5', size: .02, transparent: true, opacity: .45, depthWrite: false }));
  group.add(dust);

  let vis = false;
  function setVisible(v) { vis = v; group.visible = v; }

  function update(dt, t) {
    if (!vis) return;
    scene.fog.near = 3;
    scene.fog.far = 30;
    lamps.forEach(l => {
      l.light.intensity = l.base * (.82 + Math.sin(t * l.f + l.ph) * .12 + Math.sin(t * 13.7 + l.ph) * .06);
    });
    leds.forEach(l => {
      l.m.emissiveIntensity = l.blink
        ? (Math.sin(t * l.f + l.ph) > .2 ? l.base : .1)
        : l.base * (.7 + Math.sin(t * l.f + l.ph) * .3);
    });
    dust.rotation.y = t * .008;
  }

  return { setVisible, update, bounds: WAREHOUSE_BOUNDS };
}
