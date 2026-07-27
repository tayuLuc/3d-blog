import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { clamp } from '../utils.js';
import { bus } from '../core/bus.js';

const CFG = {
  eye: 1.65, speed: 3.4, headBob: .03,
  bounds: { x: 4.3, zMin: -5.1, zMax: 5.5 },
  gun: { x: .3, y: -.3, z: -.55 },
};

export function createPlayer({ scene, camera, dom }) {
  const controls = new PointerLockControls(camera, dom);
  const isTouch = matchMedia('(pointer:coarse)').matches;

  const device = new THREE.Group();
  const dmat = new THREE.MeshStandardMaterial({ color: '#23272f', roughness: .45, metalness: .65 });
  const tipMat = new THREE.MeshStandardMaterial({ color: '#3a2a08', emissive: '#ffb224', emissiveIntensity: 1 });
  const body  = new THREE.Mesh(new THREE.BoxGeometry(.11, .13, .46), dmat);
  const bar   = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .3), dmat);   bar.position.set(0, .02, -.33);
  const tip   = new THREE.Mesh(new THREE.BoxGeometry(.066, .066, .05), tipMat); tip.position.set(0, .02, -.5);
  const grip  = new THREE.Mesh(new THREE.BoxGeometry(.075, .2, .1), dmat);   grip.position.set(0, -.15, .13);
  grip.rotation.x = .28;
  device.add(body, bar, tip, grip);
  device.position.set(CFG.gun.x, CFG.gun.y, CFG.gun.z);
  camera.add(device);

  const lensMat = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(.16, .16), lensMat);
  lens.position.set(0, .02, -.56);
  device.add(lens);

  const chargeLight = new THREE.PointLight('#ffc46b', 0, 7, 2);
  chargeLight.position.set(.3, -.15, -.9);
  camera.add(chargeLight);

  const keys = {};
  let bob = 0, focusing = false, charge = 0;

  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (controls.isLocked && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
      e.preventDefault();
  });
  addEventListener('keyup', e => keys[e.code] = false);

  dom.addEventListener('mousedown', e => { if (e.button === 0 && controls.isLocked) focusing = true; });
  addEventListener('mouseup', () => focusing = false);

  bus.on('lock:request', () => { if (!isTouch) controls.lock(); });
  controls.addEventListener('lock',   () => bus.emit('lock:change', { locked: true }));
  controls.addEventListener('unlock', () => { focusing = false; bus.emit('lock:change', { locked: false }); });

  bus.on('charge:state', e => {
    charge = e.progress;
    lensMat.opacity = e.progress * .85;
    chargeLight.intensity = e.progress * (e.focusing ? 18 : 12);
  });

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

  function updateDevice(dt, t) {
    device.position.y = CFG.gun.y + Math.sin(bob) * .008 + Math.sin(t * 1.6) * .004 + charge * .025;
    device.position.x = CFG.gun.x + Math.cos(bob * .5) * .006;
    device.position.z = CFG.gun.z;
  }

  function update(dt, t) {
    if (controls.isLocked) move(dt);
    else if (isTouch) { camera.position.x = Math.sin(t * .25) * 1.2; camera.lookAt(0, 1.6, -4); }
    updateDevice(dt, t);
  }

  return {
    update, tipMat,
    isLocked: () => controls.isLocked,
    isFocusing: () => focusing && controls.isLocked,
    unlock: () => { if (controls.isLocked) controls.unlock(); },
  };
}
