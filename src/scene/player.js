import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { clamp } from '../utils.js';
import { bus } from '../core/bus.js';
import { economy } from '../game/economy.js';

const CFG = {
  eye: 1.65,
  speed: 3.4,
  headBob: .03,
  bounds: { x: 4.3, zMin: -5.1, zMax: 5.5 },
  bullet: { speed: 22, life: 1.4, offset: .5, drop: .1 },
  gun: { x: .3, y: -.3, z: -.55 },
  recoil: { decay: 6, kickZ: .09, kickRot: .12 },
  muzzle: { peak: 46, decay: 260, flashDecay: 14 },
};

export function createPlayer({ scene, camera, dom, tray, worldHit, getAimMesh }) {
  const controls = new PointerLockControls(camera, dom);
  const isTouch = matchMedia('(pointer:coarse)').matches;

  const gun = new THREE.Group();
  const gmat = new THREE.MeshStandardMaterial({ color: '#23272f', roughness: .45, metalness: .65 });
  const gunTipMat = new THREE.MeshStandardMaterial({ color: '#3a2a08', emissive: '#ffb224', emissiveIntensity: 1 });
  const gb    = new THREE.Mesh(new THREE.BoxGeometry(.11, .13, .46), gmat);
  const gbar  = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .3), gmat);  gbar.position.set(0, .02, -.33);
  const gtip  = new THREE.Mesh(new THREE.BoxGeometry(.066, .066, .05), gunTipMat); gtip.position.set(0, .02, -.5);
  const ggrip = new THREE.Mesh(new THREE.BoxGeometry(.075, .2, .1), gmat);  ggrip.position.set(0, -.15, .13);
  ggrip.rotation.x = .28;
  gun.add(gb, gbar, gtip, ggrip);
  gun.position.set(CFG.gun.x, CFG.gun.y, CFG.gun.z);
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

  bus.on('lock:request', () => { if (!isTouch) controls.lock(); });
  controls.addEventListener('lock',   () => bus.emit('lock:change', { locked: true }));
  controls.addEventListener('unlock', () => bus.emit('lock:change', { locked: false }));
  dom.addEventListener('mousedown', e => { if (e.button === 0 && controls.isLocked) shoot(); });

  const shotGeo = new THREE.OctahedronGeometry(.05);
  const shotMat = new THREE.MeshStandardMaterial({ color: '#ffb224', emissive: '#ffb224', emissiveIntensity: 2.2 });
  const shots = [];
  let recoil = 0;

  function shoot() {
    if (!economy.spend()) return;
    const m = new THREE.Mesh(shotGeo, shotMat);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    m.position.copy(camera.position).addScaledVector(dir, CFG.bullet.offset);
    m.position.y -= CFG.bullet.drop;
    scene.add(m);
    shots.push({ m, dir, life: CFG.bullet.life });
    recoil = 1;
    muzzleLight.intensity = CFG.muzzle.peak;
    flashMat.opacity = .9;
    bus.emit('shot:fired');
  }

  function move(dt) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    if (f || r) {
      controls.moveForward(f * CFG.speed * dt);
      controls.moveRight(r * CFG.speed * dt);
      bob += dt * 9;
    }
    camera.position.x = clamp(camera.position.x, -CFG.bounds.x, CFG.bounds.x);
    camera.position.z = clamp(camera.position.z, CFG.bounds.zMin, CFG.bounds.zMax);
    camera.position.y = CFG.eye + ((f || r) ? Math.sin(bob) * CFG.headBob : 0);
  }

  function updateGun(dt, t) {
    recoil = Math.max(0, recoil - dt * CFG.recoil.decay);
    gun.position.z = CFG.gun.z + recoil * CFG.recoil.kickZ;
    gun.rotation.x = recoil * CFG.recoil.kickRot;
    flashMat.opacity = Math.max(0, flashMat.opacity - dt * CFG.muzzle.flashDecay);
    muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * CFG.muzzle.decay);
    gun.position.y = CFG.gun.y + Math.sin(bob) * .008 + Math.sin(t * 1.6) * .004;
    gun.position.x = CFG.gun.x + Math.cos(bob * .5) * .006;
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.m.position.addScaledVector(s.dir, CFG.bullet.speed * dt);
      s.m.rotation.x += dt * 9;
      s.m.rotation.y += dt * 7;
      s.life -= dt;
      const p = s.m.position;
      let dead = s.life <= 0;
      if (!dead && worldHit?.(p)) dead = true;
      if (!dead && p.z <= tray.z) {
        dead = true;
        bus.emit('tray:hit', {
          direct: Math.abs(p.x - tray.x) < tray.halfX && Math.abs(p.y - tray.y) < tray.halfY,
        });
      }
      if (dead) { scene.remove(s.m); shots.splice(i, 1); }
    }
  }

  const ray = new THREE.Raycaster();
  const center = { x: 0, y: 0 };
  let aimed = false;
  function updateAim() {
    const mesh = getAimMesh?.() ?? null;
    let hit = false;
    if (mesh) { ray.setFromCamera(center, camera); hit = ray.intersectObject(mesh).length > 0; }
    if (hit !== aimed) { aimed = hit; bus.emit('aim:change', { hit }); }
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
