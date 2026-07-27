import * as THREE from 'three';

// ponytail: agent arena — core + modules + spawing tasks as targets
const MODULE_COLORS = {
  memory: 0x00d4ff,
  tools: 0xff6a00,
  planner: 0xaa44ff,
  core: 0xffffff,
};

export function createAgentField(scene) {
  const modules = {};
  const tasks = [];
  const clock = new THREE.Clock();

  // Core (center)
  const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: MODULE_COLORS.core,
    emissive: 0x333344,
    metalness: 0.8,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 1.5, 0);
  core.userData = { chapter: 'architecture' };
  scene.add(core);
  modules.core = core;

  // Orbiting modules
  const moduleConfigs = [
    { name: 'memory', angle: 0, radius: 2.5 },
    { name: 'tools', angle: Math.PI * 0.666, radius: 2.5 },
    { name: 'planner', angle: Math.PI * 1.333, radius: 2.5 },
  ];

  moduleConfigs.forEach((cfg) => {
    const geo = new THREE.OctahedronGeometry(0.25, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: MODULE_COLORS[cfg.name],
      emissive: MODULE_COLORS[cfg.name],
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      chapter: cfg.name,
      baseAngle: cfg.angle,
      orbitRadius: cfg.radius,
      baseY: 1.5,
    };
    scene.add(mesh);
    modules[cfg.name] = mesh;
  });

  // Task spawner (simple interval)
  let taskId = 0;
  const spawnInterval = setInterval(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 3;
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff2222,
      emissiveIntensity: 0.5,
    });
    const task = new THREE.Mesh(geo, mat);
    task.position.set(
      Math.cos(angle) * radius,
      0.5 + Math.random() * 2,
      Math.sin(angle) * radius,
    );
    task.userData = { type: 'task', id: taskId++, chapter: 'react-cycle' };
    task.addEventListener('agent-hit', () => {
      // Dispatch pipeline animation (simplified: dissolve)
      const scale = task.scale.x;
      let s = scale;
      const fade = () => {
        s *= 0.9;
        task.scale.set(s, s, s);
        if (s > 0.01) requestAnimationFrame(fade);
        else scene.remove(task);
      };
      fade();
    });
    scene.add(task);
    tasks.push(task);
  }, 3000);

  // Keep task array manageable
  const maxTasks = 10;

  function update(dt) {
    // Orbit modules
    const t = clock.getElapsedTime();
    Object.values(modules).forEach((m) => {
      if (m.userData.baseAngle !== undefined) {
        const a = m.userData.baseAngle + t * 0.3;
        m.position.x = Math.cos(a) * m.userData.orbitRadius;
        m.position.z = Math.sin(a) * m.userData.orbitRadius;
        m.position.y = m.userData.baseY + Math.sin(t * 2) * 0.2;
        m.rotation.y += dt * 1.5;
      }
    });

    // Pulse core emissive
    coreMat.emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.2;
  }

  function pause() { clearInterval(spawnInterval); }
  function resume() { /* interval re-starts on next init */ }

  return { update, pause, resume, modules, tasks };
}
