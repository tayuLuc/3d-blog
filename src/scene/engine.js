import * as THREE from 'three';

export function createEngine(canvas, stage) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0f13');
  scene.fog = new THREE.Fog('#0d0f13', 7, 26);

  const camera = new THREE.PerspectiveCamera(72, 1, .05, 60);
  camera.position.set(0, 1.65, 4.3);
  scene.add(camera);

  let visible = true;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (w < 30 || !visible) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const listeners = [];
  let last = performance.now(), T = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    T += dt;
    listeners.forEach(f => f(dt, T));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    renderer, scene, camera,
    onFrame(fn) { listeners.push(fn); },
    setVisible(v) { visible = v; resize(); },
    isVisible: () => visible,
  };
}
