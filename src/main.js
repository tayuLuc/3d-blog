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
import { createAttention } from './game/attention.js';
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

const ATT = { read: .45, tray: 1.0, node: 1.1 };

const engine   = createEngine(document.getElementById('gl'), document.getElementById('stage'));
const room     = createRoom(engine.scene);
const loop     = createLoop({ scene: engine.scene, camera: engine.camera });
const progress = createProgress();
const capsule  = createCapsule({ scene: engine.scene, anchors: room.anchors, getLevel: progress.get });
const player   = createPlayer({ scene: engine.scene, camera: engine.camera, dom: engine.renderer.domElement });
const director = createDirector({ room, loop, capsule, camera: engine.camera, progress });
room.register('token', player.tipMat, 1);

createHud();
createOverlay({ isVisible: engine.isVisible });

/* цели внимания */
function buildTargets() {
  const list = [];
  if (capsule.isIdle()) {
    if (!capsule.isRead()) {
      list.push({ kind: 'read', mesh: capsule.aimMesh(), time: ATT.read,
        label: capsule.question(), onComplete: () => capsule.markRead() });
    } else if (progress.get() < 1) {
      list.push({ kind: 'tray', mesh: room.trayMesh, time: ATT.tray,
        onComplete: () => { room.pulseTray(1); capsule.trySolve(); } });
    }
  }
  if (capsule.isRead()) {
    const an = loop.activeNode();
    if (an) list.push({ kind: 'node', mesh: an.core, time: ATT.node, index: an.index, onComplete: () => loop.advance() });
    list.push(...loop.idleNodes().map(n => ({ kind: 'fizzle', mesh: n.core, index: n.index })));
  }
  return list;
}
const attention = createAttention({
  camera: engine.camera,
  getTargets: buildTargets,
  getFocus: () => player.isFocusing(),
});
bus.on('node:fizzle', ({ index }) => loop.doFizzle(index));

/* сшивка событий */
bus.on('task:spawn', ({ task }) => {
  if (mode === '3d' && progress.get() >= 1) loop.startTask(task.steps || 1);
});
bus.on('task:solved', ({ answer }) => {
  economy.reward();
  economy.addSolved();
  bus.emit('toast', `ОТВЕТ ОТПРАВЛЕН → «${answer}»`);
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
  if (mode === '3d') {
    player.update(dt, t);
    if (player.isLocked()) attention.update(dt);
  }
  capsule.update(dt, t);
  loop.update(dt, t, activeHL);
  room.update(dt, t, activeHL);
  director.update(dt, t);
});
