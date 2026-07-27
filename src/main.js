import '@fontsource/tektur/500.css'; import '@fontsource/tektur/600.css'; import '@fontsource/tektur/700.css';
import '@fontsource/golos-text/400.css'; import '@fontsource/golos-text/500.css'; import '@fontsource/golos-text/600.css';
import '@fontsource/jetbrains-mono/400.css'; import '@fontsource/jetbrains-mono/600.css';
import './styles/base.css'; import './styles/blog.css'; import './styles/stage.css';

import { bus } from './core/bus.js';
import { initModes } from './modes.js';
import { createHud } from './hud.js';
import { createOverlay } from './ui/overlay.js';
import { createStatic } from './ui/static.js';
import { createDirector } from './director.js';
import { economy } from './game/economy.js';
import { createAttention } from './game/attention.js';
import { createPages } from './game/pages.js';
import { createShift } from './game/shift.js';
import { initBlog } from './blog/blog.js';
import { createEngine } from './scene/engine.js';
import { createRoom } from './scene/room.js';
import { createWarehouse } from './scene/warehouse.js';
import { createPlayer } from './scene/player.js';
import { createCapsule } from './scene/capsule.js';
import { createLoop } from './scene/loop.js';
import { createProgress } from './level.js';

let mode = 'split'; let activeHL = 'room';
const canvas = document.getElementById('gl');

const engine = createEngine(canvas, document.getElementById('stage'));
const room = createRoom(engine.scene);
const loop = createLoop({ parent: room.group, camera: engine.camera });
const progress = createProgress();
const capsule = createCapsule({ parent: room.group, anchors: room.anchors, getLevel: progress.get });
const warehouse = createWarehouse(engine.scene);
const pages = createPages({ scene: engine.scene, camera: engine.camera });
const shift = createShift({ pages, capsule });
const player = createPlayer({ scene: engine.scene, camera: engine.camera, dom: engine.renderer.domElement });
const director = createDirector({ room, loop, capsule, shift, camera: engine.camera, progress });
const attention = createAttention({ camera: engine.camera, getTargets: () => pages.targets(), getFocus: () => player.isFocusing() });
const staticFx = createStatic({ gl: canvas });

createHud(); createOverlay({ isVisible: engine.isVisible });

initModes(m => { mode = m; engine.setVisible(m !== 'blog'); if (m !== '3d') player.unlock();
  player.setBounds(m === '3d' ? warehouse.bounds : null); director.setMode(m); bus.emit('mode:change', { mode: m }); });
initBlog(key => { activeHL = key; director.setSection(key); });
director.apply(); bus.emit('mode:change', { mode });

bus.on('task:spawn', ({ task }) => {
  if (mode !== '3d') return;
  pages.spawnFor(task);
  bus.emit('toast', 'НОВОЕ СООБЩЕНИЕ — ИЩИ СТРАНИЦУ МЕЖДУ СТОЙКАМИ');
});
bus.on('page:solved', ({ task }) => {
  capsule.markRead();
  capsule.trySolve();
  loop.kick((task.steps || 1) + 1);
});

engine.onFrame((dt, t) => {
  economy.tick(dt);
  if (mode === '3d') { player.update(dt, t); if (player.isLocked()) attention.update(dt); }
  pages.update(dt, t); capsule.update(dt, t); loop.update(dt, t, activeHL);
  room.update(dt, t, activeHL); warehouse.update(dt, t); staticFx.update(dt); director.update(dt, t);
});
