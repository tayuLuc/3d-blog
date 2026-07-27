import * as THREE from 'three';
import { pageTex, pageBackTex, optionTex, stampTex } from '../scene/textures.js';
import { bus } from '../core/bus.js';
import { economy } from './economy.js';
import { ASK } from './messages.js';

const SPOTS = [
  { pos: [-6.5, -4], rot: .5 },{ pos: [5.5, -8], rot: -.4 },
  { pos: [8, 3.5], rot: .9 },{ pos: [-8, 6], rot: -.7 },{ pos: [0, -11], rot: .1 },
];
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

function pageTask(task) {
  const opts = shuffle([...task.opts, ASK]);
  return { q: task.q, opts, correct: task.trick ? opts.indexOf(ASK) : opts.indexOf(task.a),
    ok: task.ok ?? (task.trick ? 'УТОЧНЕНО' : `ВЕРНО → «${task.a}»`), steps: task.steps || 1 };
}

export function createPages({ scene, camera }) {
  const backTex = pageBackTex();
  const stampRead = stampTex('✓ ПРОЧИТАНО', '#4dd8c7');
  const stampDone = stampTex('ОТВЕЧЕНО', '#ffb224');
  const tmp = new THREE.Vector3();
  let pages = [];

  function makePage(task, spot, index) {
    const g = new THREE.Group(); g.position.set(spot.pos[0], 0, spot.pos[1]); g.rotation.y = spot.rot;
    const paperMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: .9, side: THREE.DoubleSide, emissive: '#2b2820', emissiveIntensity: .35 });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(.62, .85), paperMat); paper.position.y = 1.45;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 5, 6),
      new THREE.MeshBasicMaterial({ color: '#ffb224', transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.y = 2.5;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.55, 24),
      new THREE.MeshBasicMaterial({ color: '#ffb224', transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = .03;
    const light = new THREE.PointLight('#ffb224', 5, 5.5, 2); light.position.y = 1.7;
    const stamp = new THREE.Mesh(new THREE.PlaneGeometry(.4, .15), new THREE.MeshBasicMaterial({ map: stampRead, transparent: true }));
    stamp.position.set(.1, 1.12, .012); stamp.visible = false;
    g.add(paper, beam, disc, light, stamp);
    scene.add(g);
    return { task, g, paper, paperMat, beam, disc, light, stamp, index, read: false, done: false, revealT: 0, outT: 0, tokens: [] };
  }

  function spawnFor(task) {
    const t = pageTask(task);
    const s = shuffle(SPOTS)[0];
    pages.push(makePage(t, s, pages.length));
  }

  function clear() { pages.forEach(p => scene.remove(p.g)); pages = []; }

  function reveal(p) {
    if (p.read) return; p.read = true; p.revealT = 0;
    p.paperMat.map = pageTex(p.task.q, p.index + 1); p.paperMat.needsUpdate = true; p.stamp.visible = true;
    p.task.opts.forEach((text, i) => {
      const isAsk = text === ASK; const tg = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(.085), new THREE.MeshStandardMaterial({ color: '#1a1d23', emissive: isAsk ? '#4dd8c7' : '#f2efe4', emissiveIntensity: .9 }));
      const label = new THREE.Mesh(new THREE.PlaneGeometry(.54, .18), new THREE.MeshBasicMaterial({ map: optionTex(text, isAsk ? '#4dd8c7' : '#f2efe4'), transparent: true }));
      label.position.y = -.22; tg.add(core, label); p.g.add(tg);
      p.tokens.push({ g: tg, core, label, text, index: i, phase: i * (Math.PI * 2 / 3), deadT: 0, dead: false });
    });
  }

  function resolve(p, tok) {
    if (p.done || tok.dead) return; const askIdx = p.task.opts.indexOf(ASK);
    if (tok.index === p.task.correct) {
      p.done = true; p.tokens.forEach(t => t.dead = true);
      p.stamp.material.map = stampDone; p.stamp.material.needsUpdate = true;
      bus.emit('page:solved', { task: p.task });
    } else {
      tok.dead = true; economy.punish(); bus.emit('noise:spike', { power: 1 });
      bus.emit('toast', tok.index === askIdx ? 'СПРАШИВАТЬ НЕ НУЖНО — ТЫ ЭТО ЗНАЕШЬ' :
        p.task.correct === askIdx ? 'ЭТОГО НЕЛЬЗЯ ЗНАТЬ — НУЖНО УТОЧНИТЬ' : 'НЕВЕРНО · ШУМ РАСТЁТ');
    }
  }

  function update(dt, t) {
    camera.getWorldPosition(tmp);
    pages = pages.filter(p => {
      if (p.done) { p.outT += dt; p.g.position.y = -p.outT * .8; p.g.rotation.y += dt * 1.5; if (p.outT > 1) { scene.remove(p.g); return false; } return true; }
      p.revealT += dt; const pop = p.read ? 1 + Math.max(0, .35 - p.revealT) * .5 : 1; p.paper.position.y = 1.45 + Math.sin(t * 1.4 + p.index * 2) * .035;
      p.paper.rotation.y = Math.sin(t * .6 + p.index) * .08; p.paper.scale.setScalar(pop); p.paperMat.emissiveIntensity = (p.read ? .5 : .3); p.disc.material.opacity = .1 + Math.sin(t * 2 + p.index) * .04;
      p.beam.material.opacity = .1 + Math.sin(t * 2.4 + p.index) * .05;
      p.tokens = p.tokens.filter(tok => {
        if (tok.dead) { tok.deadT += dt; const k = Math.max(0, 1 - tok.deadT / .25); tok.g.scale.setScalar(k); if (k <= 0) { p.g.remove(tok.g); return false; } }
        else { const a = t * .7 + tok.phase; tok.g.position.set(Math.cos(a) * .5, 2.3 + Math.sin(t * 1.8 + tok.phase) * .05, Math.sin(a) * .5);
          tok.core.rotation.y += dt * 1.5; tok.label.lookAt(tmp); }
        return true;
      });
      return true;
    });
  }

  function targets() {
    const list = [];
    for (const p of pages) {
      if (p.done) continue; if (camera.position.distanceTo(p.g.position) > 5.5) continue;
      if (!p.read) list.push({ kind: 'read', mesh: p.paper, ref: p, time: .6, onComplete: () => reveal(p) });
      else { for (const tok of p.tokens) { if (tok.dead) continue; list.push({ kind: 'answer', mesh: tok.core, ref: tok, time: .8, label: tok.text, onComplete: () => resolve(p, tok) }); } }
    }
    return list;
  }

  return { spawnFor, clear, update, targets };
}
