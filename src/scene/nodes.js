import * as THREE from 'three';
import { nodeTex } from './textures.js';

const DEFS = [
  { key: 'observe', label: 'НАБЛЮДАЙ', color: '#ffb224', geo: () => new THREE.OctahedronGeometry(.28) },
  { key: 'think',   label: 'ДУМАЙ',    color: '#f2efe4', geo: () => new THREE.IcosahedronGeometry(.28) },
  { key: 'act',     label: 'ДЕЙСТВУЙ', color: '#4dd8c7', geo: () => new THREE.BoxGeometry(.38, .38, .38) },
];
const PEDESTAL_POS = [
  new THREE.Vector3(-3, 0, -6), new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 6),
];
const NODE_Y = 1.35;

export function createNodes({ scene, camera }) {
  const nodes = [], pedestals = [], arcs = [];
  let spawned = false, complete = false;
  const tmp = new THREE.Vector3();

  function spawn() {
    if (spawned) return; spawned = true;
    DEFS.forEach((def, i) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: '#1a1d23', emissive: def.color, emissiveIntensity: .8 });
      const core = new THREE.Mesh(def.geo(), mat);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34),
        new THREE.MeshBasicMaterial({ map: nodeTex(def.label, def.color), transparent: true }));
      label.position.y = .55;
      const light = new THREE.PointLight(def.color, 4, 5, 2); light.position.y = .3;
      g.add(core, label, light);
      const angle = (i / 3) * Math.PI * 2 + .5;
      const home = new THREE.Vector3(Math.cos(angle) * 4.5, NODE_Y, Math.sin(angle) * 4.5);
      g.position.copy(home); scene.add(g);
      nodes.push({ def, g, core, mat, label, placed: -1, home, _carried: false });
    });
    PEDESTAL_POS.forEach((pos, i) => {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.45, .5, .12, 24),
        new THREE.MeshStandardMaterial({ color: '#11141a', roughness: .7, metalness: .4 }));
      const ringMat = new THREE.MeshStandardMaterial({ color: '#0b0d10', emissive: DEFS[i].color, emissiveIntensity: .4 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .025, 8, 32), ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = .08;
      g.add(base, ring);
      g.position.copy(pos); scene.add(g);
      pedestals.push({ g, ring, mat: ringMat, pos: pos.clone(), occupied: -1, def: DEFS[i] });
    });
  }

  function placeNode(nodeIdx, pedIdx) {
    const node = nodes[nodeIdx], ped = pedestals[pedIdx];
    if (node.def.key !== ped.def.key) return false;
    node.placed = pedIdx; ped.occupied = nodeIdx;
    node.g.position.set(ped.pos.x, NODE_Y, ped.pos.z);
    ped.mat.emissiveIntensity = 1.2;
    rebuildArcs();
    if (pedestals.every(p => p.occupied >= 0)) complete = true;
    return true;
  }

  function rebuildArcs() {
    arcs.forEach(a => scene.remove(a.mesh)); arcs.length = 0;
    for (let i = 0; i < pedestals.length - 1; i++) {
      if (pedestals[i].occupied < 0 || pedestals[i+1].occupied < 0) continue;
      const a = pedestals[i].pos.clone().setY(NODE_Y);
      const b = pedestals[i+1].pos.clone().setY(NODE_Y);
      const mid = a.clone().lerp(b, .5).add(new THREE.Vector3(0, 1.8, 0));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const mat = new THREE.MeshStandardMaterial({ color: '#0b0d10', emissive: '#39424e', emissiveIntensity: .5 });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .02, 6), mat);
      scene.add(mesh);
      arcs.push({ mesh, mat, curve, from: i, to: i+1 });
    }
  }

  function flowPath() { if (!complete) return null; return pedestals.map(p => p.pos.clone().setY(NODE_Y)); }
  function pulseNode(pedIdx, power = 1) { const p = pedestals[pedIdx]; if (p.occupied >= 0) { const n = nodes[p.occupied]; n.mat.emissiveIntensity = 2.5 * power; n.core.scale.setScalar(1.4); } }
  function arcGlow(arcIdx, v) { if (arcs[arcIdx]) arcs[arcIdx].mat.emissiveIntensity = v; }

  function update(dt, t) {
    if (!spawned) return; camera.getWorldPosition(tmp);
    nodes.forEach((n, i) => {
      if (n._carried && n.placed < 0) {
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
        const target = tmp.clone().addScaledVector(dir, 2.2).add(new THREE.Vector3(0, -.3, 0));
        n.g.position.lerp(target, Math.min(1, dt * 8));
      } else if (n.placed >= 0) {
        n.core.rotation.y += dt * .8;
        n.mat.emissiveIntensity += (.8 - n.mat.emissiveIntensity) * Math.min(1, dt * 4);
        n.core.scale.setScalar(n.core.scale.x + (1 - n.core.scale.x) * Math.min(1, dt * 6));
      } else {
        n.g.position.y = NODE_Y + Math.sin(t * 1.6 + i * 2) * .08;
        n.core.rotation.y += dt * 1.2; n.core.rotation.x += dt * .4;
      }
      n.label.lookAt(tmp);
    });
    pedestals.forEach((p, i) => { if (p.occupied < 0) p.mat.emissiveIntensity = .3 + Math.sin(t * 3 + i) * .15; });
    arcs.forEach(a => { a.mat.emissiveIntensity += (.5 - a.mat.emissiveIntensity) * Math.min(1, dt * 3); });
  }

  return {
    spawn, update, placeNode, flowPath, pulseNode, arcGlow,
    isComplete: () => complete, isSpawned: () => spawned,
    getNodes: () => nodes, getPedestals: () => pedestals, getArcs: () => arcs,
    reset() { nodes.forEach(n => { n.placed = -1; n._carried = false; n.g.position.copy(n.home); });
      pedestals.forEach(p => { p.occupied = -1; p.mat.emissiveIntensity = .4; });
      arcs.forEach(a => scene.remove(a.mesh)); arcs.length = 0; complete = false; },
  };
}
