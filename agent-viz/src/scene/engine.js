import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createPlayer } from './player.js';
import { createAgentField } from './agents.js';

// ponytail: singleton scene — one renderer, one loop, one clock
export function initScene() {
  const canvas = document.getElementById('scene-canvas');
  const panel = document.getElementById('scene-panel');
  if (!canvas || !panel) return { pause() {}, resume() {} };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a0f);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.035);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
  camera.position.set(0, 2, 5);

  // Lights
  const ambient = new THREE.AmbientLight(0x334466, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffeedd, 0.8);
  dir.position.set(5, 8, 3);
  scene.add(dir);
  const point = new THREE.PointLight(0xff6a00, 2, 20);
  point.position.set(0, 3, 0);
  scene.add(point);

  // Grid floor
  const grid = new THREE.GridHelper(40, 40, 0x2a2a36, 0x1a1a24);
  scene.add(grid);

  // Controls (pointer lock, active only in 3d/together)
  const controls = new PointerLockControls(camera, document.body);
  const player = createPlayer(camera, controls, scene);
  const agents = createAgentField(scene);

  // Resize
  const ro = new ResizeObserver(() => {
    const w = panel.clientWidth;
    const h = panel.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  });
  ro.observe(panel);
  // Initial size
  ro.takeRecords();
  const initW = panel.clientWidth;
  const initH = panel.clientHeight;
  renderer.setSize(initW, initH);
  camera.aspect = initW / Math.max(initH, 1);
  camera.updateProjectionMatrix();

  // Animation loop
  const clock = new THREE.Clock();
  let running = true;
  let rafId = null;

  function animate() {
    if (!running) return;
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    player.update(dt);
    agents.update(dt);
    renderer.render(scene, camera);
  }

  function pause() { running = false; }
  function resume() { running = true; clock.start(); animate(); }

  return { pause, resume, player, agents, scene, camera, renderer };
}
