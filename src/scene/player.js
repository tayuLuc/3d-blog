import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { clamp } from '../utils.js';

export function createPlayer({ scene, camera, dom, hud, tray, onTrayHit, getAimMesh, onAim, isVisible, worldHit }) {
  const controls = new PointerLockControls(camera, dom);

  const gun = new THREE.Group();
  const gmat = new THREE.MeshStandardMaterial({ color: '#23272f', roughness: .45, metalness: .65 });
  const gunTipMat = new THREE.MeshStandardMaterial({ color: '#3a2a08', emissive: '#ffb224', emissiveIntensity: 1 });
  const gb    = new THREE.Mesh(new THREE.BoxGeometry(.11, .13, .46), gmat);
  const gbar  = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .3), gmat);  gbar.position.set(0, .02, -.33);
  const gtip  = new THREE.Mesh(new THREE.BoxGeometry(.066, .066, .05), gunTipMat); gtip.position.set(0, .02, -.5);
  const ggrip = new THREE.Mesh(new THREE.BoxGeometry(.075, .2, .1), gmat);  ggrip.position.set(0, -.15, .13);
  ggrip.rotation.x = .28;
  gun.add(gb, gbar, gtip, ggrip);
  gun.position.set(.3, -.3, -.55);
  camera.add(gun);

  const flashMat = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(.16, .16), flashMat);
  flash.position.set(0, .02, -.56);
  gun.add(flash);

  const muzzleLight = new THREE.PointLight('#ffc46b', 0, 7, 2);
  muzzleLight.position.set(.3, -.15, -.9);
  camera.add(muzzleLight);

  const keys = {};
  let bob = 0;
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (controls.isLocked && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
      e.preventDefault();
  });
  addEventListener('keyup', e => keys[e.code] = false);

  const overlay = document.getElementById('overlay');
  const isTouch = matchMedia('(pointer:coarse)').matches;
  if (isTouch) {
    document.getElementById('ovTitle').innerHTML = '<i class="pulse"></i>3D — С ДЕСКТОПА';
    document.getElementById('ovKeys').textContent = 'Нужны клавиатура и мышь: WASD + ЛКМ.';
    overlay.style.cursor = 'default';
  }
  overlay.addEventListener('click', () => { if (!isTouch) controls.lock(); });
  controls.addEventListener('lock',   () => { hud.setLocked(true);  overlay.classList.add('hidden'); });
  controls.addEventListener('unlock', () => { hud.setLocked(false); if (isVisible()) overlay.classList.remove('hidden'); });
  dom.addEventListener('mousedown', e => { if (e.button === 0 && controls.isLocked) shoot(); });

  const shotGeo = new THREE.OctahedronGeometry(.05);
  const shotMat = new THREE.MeshStandardMaterial({ color: '#ffb224', emissive: '#ffb224', emissiveIntensity: 2.2 });
  const shots = [];
  let recoil = 0;

  function shoot() {
    if (!hud.spendToken()) return;
    const m = new THREE.Mesh(shotGeo, shotMat);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    m.position.copy(camera.position).addScaledVector(dir, .5);
    m.position.y -= .1;
    scene.add(m);
    shots.push({ m, dir, life: 1.4 });
    recoil = 1; muzzleLight.intensity = 46; flashMat.opacity = .9;
    hud.kickCross();
  }

  function move(dt) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    if (f || r) {
      controls.moveForward(f * 3.4 * dt);
      controls.moveRight(r * 3.4 * dt);
      bob += dt * 9;
    }
    camera.position.x = clamp(camera.position.x, -4.3, 4.3);
    camera.position.z = clamp(camera.position.z, -5.1, 5.5);
    camera.position.y = 1.65 + ((f || r) ? Math.sin(bob) * .03 : 0);
  }

  function updateGun(dt, t) {
    recoil = Math.max(0, recoil - dt * 6);
    gun.position.z = -.55 + recoil * .09;
    gun.rotation.x = recoil * .12;
    flashMat.opacity = Math.max(0, flashMat.opacity - dt * 14);
    muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 260);
    gun.position.y = -.3 + Math.sin(bob) * .008 + Math.sin(t * 1.6) * .004;
    gun.position.x = .3 + Math.cos(bob * .5) * .006;
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.m.position.addScaledVector(s.dir, 22 * dt);
      s.m.rotation.x += dt * 9;
      s.m.rotation.y += dt * 7;
      s.life -= dt;
      const p = s.m.position;
      let dead = s.life <= 0;
      if (!dead && worldHit && worldHit(p)) dead = true;
      if (!dead && p.z <= tray.z) {
        dead = true;
        const direct = Math.abs(p.x - tray.x) < tray.halfX && Math.abs(p.y - tray.y) < tray.halfY;
        onTrayHit(direct);
      }
      if (dead) { scene.remove(s.m); shots.splice(i, 1); }
    }
  }

  const ray = new THREE.Raycaster();
  function updateAim() {
    const mesh = getAimMesh();
    if (!mesh) { onAim(false); return; }
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    onAim(ray.intersectObject(mesh).length > 0);
  }

  function update(dt, t) {
    if (controls.isLocked) move(dt);
    else if (isTouch) { camera.position.x = Math.sin(t * .25) * 1.2; camera.lookAt(0, 1.6, -4); }
    updateGun(dt, t);
    updateShots(dt);
    updateAim();
  }

  return {
    update,
    tipMat: gunTipMat,
    unlock: () => { if (controls.isLocked) controls.unlock(); },
  };
}
