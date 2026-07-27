import * as THREE from 'three';

// ponytail: player controls — WASD + pointer lock + raycast shoot
export function createPlayer(camera, controls, scene) {
  const keys = {};
  const bullets = [];

  document.addEventListener('keydown', (e) => (keys[e.code] = true));
  document.addEventListener('keyup', (e) => (keys[e.code] = false));

  // Shoot on click (fire = task dispatch)
  document.addEventListener('click', () => {
    if (!controls.isLocked) return;
    shoot(camera, scene);
  });

  function shoot(cam, sc) {
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const ray = new THREE.Raycaster(cam.position, dir, 0, 100);
    const hits = ray.intersectObjects(sc.children, true);

    if (hits.length > 0) {
      const hit = hits[0].object;
      // Trigger pipeline animation on hit
      hit.dispatchEvent(new CustomEvent('agent-hit', { bubbles: true }));
    }
  }

  function update(dt) {
    if (!controls.isLocked) return;
    const speed = 8 * dt;
    const move = new THREE.Vector3();

    if (keys['KeyW']) move.z -= 1;
    if (keys['KeyS']) move.z += 1;
    if (keys['KeyA']) move.x -= 1;
    if (keys['KeyD']) move.x += 1;

    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

    // Apply relative to camera yaw
    const yaw = new THREE.Quaternion();
    yaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    move.applyQuaternion(yaw);

    camera.position.add(move);

    // Jump (space)
    if (keys['Space']) {
      // Simplified: just a quick upward nudge
      camera.position.y += 2 * dt;
    }
  }

  return { update };
}
