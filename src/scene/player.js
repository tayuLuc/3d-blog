import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { clamp } from '../utils.js';
import { bus } from '../core/bus.js';

const CFG = { eye: 1.65, speed: 3.4, headBob: .03, bounds: { x: 4.3, zMin: -5.1, zMax: 5.5 }, fov: 72 };

export function createPlayer({ scene, camera, dom }) {
  const controls = new PointerLockControls(camera, dom);
  const isTouch = matchMedia('(pointer:coarse)').matches;

  const attLight = new THREE.PointLight('#ffc46b', 0, 8, 2);
  attLight.position.set(0, -.1, -.6);
  camera.add(attLight);
  bus.on('charge:state', e => { attLight.intensity = e.progress * (e.focusing ? 14 : 9); });

  const keys = {};
  let bob = 0, focusing = false, bounds = CFG.bounds, shake = 0;

  bus.on('noise:spike', ({ power = 1 }) => { shake = Math.max(shake, Math.min(1.4, power)); });

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

  function move(dt) {
    const f = (keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
    const r = (keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
    if (f||r) { controls.moveForward(f*CFG.speed*dt); controls.moveRight(r*CFG.speed*dt); bob+=dt*9; }
    camera.position.x = clamp(camera.position.x, -bounds.x, bounds.x);
    camera.position.z = clamp(camera.position.z, bounds.zMin, bounds.zMax);
    camera.position.y = CFG.eye+((f||r)?Math.sin(bob)*CFG.headBob:0);
  }

  function update(dt, t) {
    if (controls.isLocked) move(dt);
    else if (isTouch) { camera.position.x=Math.sin(t*.25)*1.2; camera.lookAt(0,1.6,-4); }
    if (shake > 0) {
      camera.fov = CFG.fov + Math.random() * 5 * shake;
      camera.updateProjectionMatrix();
      shake = Math.max(0, shake - dt * 2.2);
    } else if (Math.abs(camera.fov - CFG.fov) > .1) {
      camera.fov = CFG.fov;
      camera.updateProjectionMatrix();
    }
  }

  return {
    update,
    isLocked: () => controls.isLocked,
    isFocusing: () => focusing && controls.isLocked,
    unlock: () => { if (controls.isLocked) controls.unlock(); },
    setBounds(b) { bounds = b ?? CFG.bounds; },
  };
}
