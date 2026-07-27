import '@fontsource/tektur/500.css';
import '@fontsource/tektur/600.css';
import '@fontsource/tektur/700.css';
import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/500.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';

import './styles/base.css';
import './styles/blog.css';
import './styles/stage.css';

import { bus } from './core/bus.js';
import { initModes } from './modes.js';
import { createHud } from './hud.js';
import { createOverlay } from './ui/overlay.js';
import { createDirector } from './director.js';
import { economy } from './game/economy.js';
import { initBlog } from './blog/blog.js';
import { createEngine } from './scene/engine.js';
import { createRoom } from './scene/room.js';
import { createPlayer } from './scene/player.js';
import { createCapsule } from './scene/capsule.js';
import { createLoop } from './scene/loop.js';
import { createProgress } from './level.js';

let mode = 'split';
let activeHL = 'room';

const engine   = createEngine(document.getElementById('gl'), document.getElementById('stage'));
const room     = createRoom(engine.scene);
const loop     = createLoop({ scene: engine.scene, camera: engine.camera });
const progress = createProgress();
const capsule  = createCapsule({ scene: engine.scene, anchors: room.anchors, getLevel: progress.get });
const player   = createPlayer({
  scene: engine.scene,
  camera: engine.camera,
  dom: engine.renderer.domElement,
  tray: room.trayArea,
  worldHit: p => loop.hitTest(p),
  getAimMesh: () => capsule.aimMesh(),
});
const director = createDirector({ room, loop, capsule, camera: engine.camera, progress });
room.register('token', player.tipMat, 1);

createHud();
createOverlay({ isVisible: engine.isVisible });

bus.on('task:spawn', ({ task }) => {
  if (mode === '3d' && progress.get() >= 1) loop.startTask(task.steps || 1);
});
bus.on('task:solved', ({ answer }) => {
  economy.reward();
  economy.addSolved();
  bus.emit('toast', `ОТВЕТ ОТПРАВЛЕН → «${answer}»`);
});
bus.on('tray:hit', ({ direct }) => {
  if (!direct) { room.pulseTray(.25); return; }
  if (loop.isActive()) {
    room.pulseTray(.25);
    bus.emit('toast', 'АГЕНТ ЕЩЁ В ЦИКЛЕ — ЗАВЕРШИ ФАЗУ');
    return;
  }
  room.pulseTray(1);
  capsule.trySolve();
});
bus.on('aim:change', ({ hit }) => {
  bus.emit('readout', hit ? { text: capsule.question() } : null);
});

initModes(m => {
  mode = m;
  engine.setVisible(m !== 'blog');
  if (m !== '3d') player.unlock();
  director.setMode(m);
  bus.emit('mode:change', { mode: m });
});
initBlog(key => {
  activeHL = key;
  director.setSection(key);
});

director.apply();
bus.emit('mode:change', { mode });

engine.onFrame((dt, t) => {
  economy.tick(dt);
  if (mode === '3d') player.update(dt, t);
  capsule.update(dt, t);
  loop.update(dt, t, activeHL);
  room.update(dt, t, activeHL);
  director.update(dt, t);
});
