import * as THREE from 'three';
import { gridTex, signTex } from './textures.js';
import { easeOut } from '../utils.js';

export function buildRoom(scene) {
  const shellMat = new THREE.MeshStandardMaterial({ map: gridTex(), side: THREE.BackSide, roughness: .95 });
  const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 12), shellMat);
  roomMesh.position.y = 2.25;
  scene.add(roomMesh);

  const edgeMat = new THREE.LineBasicMaterial({ color: '#2e3944', transparent: true, opacity: 0 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(roomMesh.geometry), edgeMat);
  edges.position.copy(roomMesh.position);
  scene.add(edges);

  const outerGrid = new THREE.GridHelper(90, 90, '#22303a', '#141b22');
  outerGrid.position.y = -.06;
  outerGrid.material.transparent = true;
  outerGrid.material.opacity = 0;
  scene.add(outerGrid);

  const stripMat = new THREE.MeshStandardMaterial({ color: '#0b0d10', emissive: '#39424e', emissiveIntensity: .55 });
  [[9.6,.05,.05, 0,3.55,-5.92], [9.6,.05,.05, 0,3.55,5.92],
   [.05,.05,11.7, -4.92,3.55,0], [.05,.05,11.7, 4.92,3.55,0]]
  .forEach(([w, h, d, px, py, pz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stripMat);
    m.position.set(px, py, pz);
    scene.add(m);
  });

  const slotSlitMat = new THREE.MeshStandardMaterial({ color: '#241703', emissive: '#ffb224', emissiveIntensity: 1.3 });
  const slotFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.05, .12),
    new THREE.MeshStandardMaterial({ color: '#0a0c0f', roughness: .9 }));
  slotFrame.position.set(-2.2, 2.45, -5.9); scene.add(slotFrame);
  const slotSlit = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .13), slotSlitMat);
  slotSlit.position.set(-2.2, 2.45, -5.83); scene.add(slotSlit);
  const slotSign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .37),
    new THREE.MeshBasicMaterial({ map: signTex('ВХОД // REQUEST', '#ffb224') }));
  slotSign.position.set(-2.2, 3.28, -5.92); scene.add(slotSign);

  const trayGlowMat = new THREE.MeshStandardMaterial({ color: '#061a18', emissive: '#4dd8c7', emissiveIntensity: .85 });
  const trayFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, .12),
    new THREE.MeshStandardMaterial({ color: '#0a0c0f', roughness: .9 }));
  trayFrame.position.set(2.2, 1.15, -5.9); scene.add(trayFrame);
  const trayGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.35, .85), trayGlowMat);
  trayGlow.position.set(2.2, 1.15, -5.83); scene.add(trayGlow);
  const trayShelf = new THREE.Mesh(new THREE.BoxGeometry(1.7, .08, .4),
    new THREE.MeshStandardMaterial({ color: '#0a0c0f', roughness: .9 }));
  trayShelf.position.set(2.2, .58, -5.72); scene.add(trayShelf);
  const traySign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .37),
    new THREE.MeshBasicMaterial({ map: signTex('ВЫХОД // RESPONSE', '#4dd8c7') }));
  traySign.position.set(2.2, 2.0, -5.92); scene.add(traySign);

  scene.add(new THREE.HemisphereLight('#8fa0b5', '#0b0d11', .5));
  const slotLight = new THREE.PointLight('#ffb224', 26, 13, 2);
  slotLight.position.set(-2.2, 2.6, -4.4); scene.add(slotLight);
  const trayLight = new THREE.PointLight('#4dd8c7', 12, 11, 2);
  trayLight.position.set(2.2, 1.4, -4.4); scene.add(trayLight);
  const fill = new THREE.PointLight('#5a6f8a', 9, 18, 2);
  fill.position.set(0, 3.3, 4.6); scene.add(fill);

  const N = 240, dp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    dp[i*3]   = (Math.random()*2 - 1) * 4.7;
    dp[i*3+1] = .2 + Math.random() * 4;
    dp[i*3+2] = (Math.random()*2 - 1) * 5.6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo,
    new THREE.PointsMaterial({ color: '#8b96a5', size: .02, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(dust);

  const HL = {
    room: { mats: [stripMat],    base: .55 },
    slot: { mats: [slotSlitMat], base: 1.3 },
    tray: { mats: [trayGlowMat], base: .85 },
  };
  let trayPulse = 0;
  let opened = false, openT = 0, hlWalls = 0, hlEntropy = 0;
  const cFrom = new THREE.Color('#ffffff'), cTo = new THREE.Color('#59616c');

  return {
    anchors: {
      SLOT:  new THREE.Vector3(-2.2, 2.45, -5.4),
      HOVER: new THREE.Vector3(-.55, 1.8, -3.3),
      TRAY:  new THREE.Vector3(2.2, 1.15, -5.5),
    },
    trayArea: { x: 2.2, y: 1.15, halfX: .85, halfY: .62, z: -5.7 },
    register(key, mat, base) { HL[key] = { mats: [mat], base }; },
    pulseTray(i = 1) { trayPulse = Math.max(trayPulse, i); },
    openWalls() { opened = true; },
    update(dt, t, active) {
      const pulse = (Math.sin(t * 3.6) * .5 + .5);
      for (const k in HL) {
        const h = HL[k], target = h.base + (k === active ? pulse * 1.8 : 0);
        h.mats.forEach(m => m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 7));
      }
      if (opened && openT < 1) {
        openT = Math.min(1, openT + dt / 1.4);
        const e = easeOut(openT);
        shellMat.transparent = true;
        shellMat.opacity = 1 - e * .88;
        shellMat.color.lerpColors(cFrom, cTo, e);
        scene.fog.far = 26 + e * 44;
      }
      const e = easeOut(openT);
      hlWalls   += ((active === 'walls'   ? 1 : 0) - hlWalls)   * Math.min(1, dt * 5);
      hlEntropy += ((active === 'entropy' ? 1 : 0) - hlEntropy) * Math.min(1, dt * 5);
      edgeMat.opacity       = e * (.75 + hlWalls * pulse * .6);
      outerGrid.material.opacity = e * (.45 + hlEntropy * pulse * .4);
      slotLight.intensity = 26 + Math.sin(t * 13.7) * 2 + Math.sin(t * 4.1) * 3;
      trayGlowMat.emissiveIntensity += trayPulse * 2.5;
      trayPulse = Math.max(0, trayPulse - dt * 3);
      trayLight.intensity = 12 + trayPulse * 40;
      dust.rotation.y = t * .012;
    },
  };
}
