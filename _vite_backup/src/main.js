import './layout.css';
import { initScene } from './scene.js';
import { initBlog } from './blog.js';
import { initSync } from './sync.js';

const body = document.body;
const modeButtons = document.querySelectorAll('.modes button');
let currentMode = 'blog';

function setMode(mode) {
  currentMode = mode;
  body.dataset.mode = mode;
  modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));

  if (mode === '3d' || mode === 'together') {
    const panel = document.getElementById('scene-panel');
    panel?.requestPointerLock?.();
  } else {
    document.exitPointerLock?.();
  }

  if (mode === 'blog') {
    window.__scene?.pause?.();
  } else {
    window.__scene?.resume?.();
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

document.addEventListener('keydown', (e) => {
  if (e.key === '1') setMode('blog');
  if (e.key === '2') setMode('together');
  if (e.key === '3') setMode('3d');
  if (e.key === 'Escape') document.exitPointerLock?.();
});

async function init() {
  await initBlog();
  const scene = initScene();
  window.__scene = scene;
  initSync();
}

init();
