// ponytail: blog ↔ 3D sync via CustomEvents
import { window } from './main.js';

export function initSync() {
  // When a blog chapter scrolls into view → pulse the corresponding module
  window.addEventListener('chapter-visible', (e) => {
    const chapter = e.detail;
    const module = window.__scene?.agents?.modules?.[chapter];
    if (module) {
      pulseModule(module);
    }
  });

  // When a 3D module is hit → scroll blog to corresponding chapter (in together mode)
  document.addEventListener('agent-hit', (e) => {
    const hit = e.target;
    const chapter = hit.userData?.chapter;
    if (chapter) {
      const el = document.getElementById(chapter);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

function pulseModule(mesh) {
  const base = mesh.material.emissiveIntensity;
  mesh.material.emissiveIntensity = 2;
  setTimeout(() => { mesh.material.emissiveIntensity = base; }, 600);
}
