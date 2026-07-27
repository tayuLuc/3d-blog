import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ── Level 0: Black Box — a dark room with a slot, a tray, a floating capsule ──

export function initScene() {
  const canvas = document.getElementById('scene-canvas');
  const panel = document.getElementById('scene-panel');
  if (!canvas || !panel) return { pause() {}, resume() {} };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x08080c);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08080c, 0.06);

  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 200);
  camera.position.set(0, 1.6, 4);

  /* ── Lights ── */
  const amb = new THREE.AmbientLight(0x222233, 0.5);
  scene.add(amb);

  const slotLight = new THREE.PointLight(0xff9500, 3, 8);
  slotLight.position.set(0, 1.5, -4.5);
  scene.add(slotLight);

  const trayLight = new THREE.PointLight(0x00d4ff, 2, 6);
  trayLight.position.set(0, 0.3, -3);
  scene.add(trayLight);

  const roomLight = new THREE.PointLight(0x334466, 1, 15);
  roomLight.position.set(0, 4, 0);
  scene.add(roomLight);

  /* ── Room ── */
  const roomGeo = new THREE.BoxGeometry(12, 6, 10);
  const roomMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.95, metalness: 0.05 });
  const room = new THREE.Mesh(roomGeo, roomMat);
  room.position.set(0, 3, 0);
  room.receiveShadow = true;
  scene.add(room);

  // Slot opening in front wall (cutout via smaller box offset)
  const slotGeo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 1, metalness: 0 });
  const slot = new THREE.Mesh(slotGeo, slotMat);
  slot.position.set(0, 1.5, -4.98);
  scene.add(slot);

  // Slot glow plane
  const slotGlowGeo = new THREE.PlaneGeometry(1.1, 0.7);
  const slotGlowMat = new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const slotGlow = new THREE.Mesh(slotGlowGeo, slotGlowMat);
  slotGlow.position.set(0, 1.5, -4.9);
  scene.add(slotGlow);

  /* ── Tray ── */
  const trayGeo = new THREE.BoxGeometry(2, 0.15, 1);
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.7, metalness: 0.3, emissive: 0x001122, emissiveIntensity: 0.3 });
  const tray = new THREE.Mesh(trayGeo, trayMat);
  tray.position.set(0, 0.075, -2.5);
  scene.add(tray);

  // Tray edge glow
  const trayEdgeGeo = new THREE.BoxGeometry(2.05, 0.02, 1.05);
  const trayEdgeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
  const trayEdge = new THREE.Mesh(trayEdgeGeo, trayEdgeMat);
  trayEdge.position.set(0, 0.16, -2.5);
  scene.add(trayEdge);

  /* ── Capsule (floating target) ── */
  const capsuleGeo = new THREE.CapsuleGeometry(0.25, 0.6, 8, 16);
  const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.7, emissive: 0xffffff, emissiveIntensity: 0.1 });
  const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
  capsule.position.set(0, 1.5, -3.5);
  capsule.userData = { chapter: 'blackbox', baseY: 1.5, phase: 0 };
  scene.add(capsule);

  // Capsule glow ring
  const ringGeo = new THREE.TorusGeometry(0.35, 0.02, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(capsule.position);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  /* ── Gun (attached to camera) ── */
  const gunGroup = new THREE.Group();
  const barrelGeo = new THREE.BoxGeometry(0.04, 0.04, 0.5);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.position.set(0, 0, -0.25);
  gunGroup.add(barrel);

  const gripGeo = new THREE.BoxGeometry(0.06, 0.12, 0.08);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.set(0, -0.08, 0.15);
  gunGroup.add(grip);

  camera.add(gunGroup);
  scene.add(camera);

  /* ── Particles (dust) ── */
  const dustCount = 60;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3]     = (Math.random() - 0.5) * 10;
    dustPositions[i * 3 + 1] = Math.random() * 5;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.4 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ── Projectiles ── */
  const projectiles = [];
  const projectileGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const projectileMat = new THREE.MeshBasicMaterial({ color: 0xff9500 });
  const maxProjectiles = 20;

  let tokenCount = Infinity;
  let taskCount = 0;
  let aimTarget = null;

  /* ── Controls ── */
  const controls = new PointerLockControls(camera, document.body);
  scene.add(controls.getObject());

  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.code] = true));
  document.addEventListener('keyup', (e) => (keys[e.code] = false));

  // Shoot on click
  document.addEventListener('click', () => {
    if (!controls.isLocked) return;
    if (tokenCount <= 0) return;
    tokenCount--;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone().add(dir.clone().multiplyScalar(0.3));
    origin.y -= 0.1;

    const proj = new THREE.Mesh(projectileGeo, projectileMat);
    proj.position.copy(origin);
    proj.userData = { velocity: dir.multiplyScalar(20), life: 1.5 };
    scene.add(proj);
    projectiles.push(proj);
  });

  // Raycaster for aim detection
  const raycaster = new THREE.Raycaster();
  const aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

  /* ── Resize ── */
  const ro = new ResizeObserver(() => {
    const w = panel.clientWidth;
    const h = panel.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  });
  ro.observe(panel);
  ro.takeRecords();
  const iw = panel.clientWidth;
  const ih = panel.clientHeight;
  renderer.setSize(iw, ih);
  camera.aspect = iw / Math.max(ih, 1);
  camera.updateProjectionMatrix();

  /* ── Animation ── */
  const clock = new THREE.Clock();
  let running = true;
  let rafId = null;
  let muzzleFlash = null;

  function animate() {
    if (!running) return;
    rafId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    // Movement
    if (controls.isLocked) {
      const speed = 6 * dt;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keys['KeyW']) camera.position.addScaledVector(forward, speed);
      if (keys['KeyS']) camera.position.addScaledVector(forward, -speed);
      if (keys['KeyA']) camera.position.addScaledVector(right, -speed);
      if (keys['KeyD']) camera.position.addScaledVector(right, speed);

      // Bounds
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5, 5);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8, 2);
      camera.position.y = 1.6;
    }

    // Capsule bob
    capsule.position.y = capsule.userData.baseY + Math.sin(elapsed * 2) * 0.15;
    capsule.rotation.y += dt * 0.5;
    ring.position.y = capsule.position.y;
    ring.rotation.z += dt * 2;
    ringMat.opacity = 0.3 + Math.sin(elapsed * 4) * 0.3;

    // Slot glow pulse
    slotGlowMat.opacity = 0.3 + Math.sin(elapsed * 3) * 0.15;

    // Tray pulse
    trayEdgeMat.opacity = 0.3 + Math.sin(elapsed * 2.5) * 0.2;

    // Dust drift
    const posAttr = dust.geometry.getAttribute('position');
    for (let i = 0; i < dustCount; i++) {
      posAttr.array[i * 3 + 1] += dt * 0.1;
      if (posAttr.array[i * 3 + 1] > 5) posAttr.array[i * 3 + 1] = 0;
    }
    posAttr.needsUpdate = true;

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.position.addScaledVector(p.userData.velocity, dt);
      p.userData.life -= dt;

      // Hit tray check
      if (p.position.z > -3.0 && p.position.z < -2.0 && Math.abs(p.position.x) < 1.1 && p.position.y < 0.3) {
        scene.remove(p);
        projectiles.splice(i, 1);
        taskCount++;
        document.getElementById('hud-tasks').textContent = `tasks ${taskCount}`;
        // Flash tray
        trayEdgeMat.color.setHex(0x00ff88);
        setTimeout(() => trayEdgeMat.color.setHex(0x00d4ff), 150);
        continue;
      }

      // Hit capsule check
      const dist = p.position.distanceTo(capsule.position);
      if (dist < 0.5) {
        scene.remove(p);
        projectiles.splice(i, 1);
        // Capsule flash
        capsuleMat.emissive.setHex(0x00d4ff);
        capsuleMat.emissiveIntensity = 2;
        setTimeout(() => { capsuleMat.emissive.setHex(0xffffff); capsuleMat.emissiveIntensity = 0.1; }, 300);
        // Spawn "solved" particle burst
        for (let j = 0; j < 8; j++) {
          const spark = new THREE.Mesh(projectileGeo, new THREE.MeshBasicMaterial({ color: 0x00d4ff }));
          spark.position.copy(capsule.position);
          spark.userData = { velocity: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8), life: 0.6 };
          scene.add(spark);
          projectiles.push(spark);
        }
        continue;
      }

      if (p.userData.life <= 0) {
        scene.remove(p);
        projectiles.splice(i, 1);
      }
    }

    // Muzzle flash decay
    if (muzzleFlash) {
      muzzleFlash.scale.multiplyScalar(0.85);
      if (muzzleFlash.scale.x < 0.01) {
        scene.remove(muzzleFlash);
        muzzleFlash = null;
      }
    }

    // HUD
    document.getElementById('hud-tokens').textContent = `tokens ${tokenCount === Infinity ? '∞' : tokenCount}`;

    renderer.render(scene, camera);
  }

  function pause() { running = false; }
  function resume() { running = true; clock.start(); animate(); }

  return { pause, resume, camera, scene, renderer, controls };
}
