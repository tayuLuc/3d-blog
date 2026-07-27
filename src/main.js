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

import { initModes } from './modes.js';
import * as hud from './hud.js';
import { initBlog } from './blog/blog.js';
import { createEngine } from './scene/engine.js';
import { buildRoom } from './scene/room.js';
import { createPlayer } from './scene/player.js';
import { createCapsule } from './scene/capsule.js';

const canvas = document.getElementById('gl');
const stage = document.getElementById('stage');

const engine = createEngine(canvas, stage);
const room = buildRoom(engine.scene);

const capsule = createCapsule({
  scene: engine.scene,
  anchors: room.anchors,
  onSolved(answer) {
    hud.addScore();
    hud.addTokens(48);
    hud.toast('ОТВЕТ ОТПРАВЛЕН → «' + answer + '»');
  },
});

const player = createPlayer({
  scene: engine.scene,
  camera: engine.camera,
  dom: engine.renderer.domElement,
  hud,
  tray: room.trayArea,
  isVisible: engine.isVisible,
  onTrayHit(direct) { room.pulseTray(direct ? 1 : .25); if (direct) capsule.trySolve(); },
  getAimMesh: () => capsule.aimMesh(),
  onAim(hit) { capsule.setAimed(hit); hud.readout(hit ? capsule.question() : null); },
});

room.register('token', player.tipMat, 1);

let activeHL = 'room';
initModes(m => { if (m === 'blog') player.unlock(); });
initBlog(key => { activeHL = key; });
hud.init();

engine.onFrame((dt, t) => {
  hud.tick(dt);
  player.update(dt, t);
  capsule.update(dt, t);
  room.update(dt, t, activeHL);
});
