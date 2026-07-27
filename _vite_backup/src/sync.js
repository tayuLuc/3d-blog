// ── Sync: blog scrollspy ↔ 3D module highlighting ──

export function initSync() {
  window.addEventListener('chapter-visible', (e) => {
    const chapter = e.detail;
    const mesh = window.__scene?.scene?.getObjectByName(chapter);
    if (mesh) {
      const base = mesh.material.emissiveIntensity;
      mesh.material.emissiveIntensity = 3;
      setTimeout(() => { mesh.material.emissiveIntensity = base; }, 800);
    }
  });
}
