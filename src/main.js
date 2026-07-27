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
import { createAttention } from './game/attention.js';
import { economy } from './game/economy.js';
import { createCircuit } from './game/circuit.js';
import { createInteract } from './game/interact.js';
import { initBlog } from './blog/blog.js';
import { createEngine } from './scene/engine.js';
import { createVoid } from './scene/void.js';
import { createNodes } from './scene/nodes.js';
import { createOrbs } from './scene/orbs.js';
import { createPlayer } from './scene/player.js';
import { createProgress } from './level.js';

let mode = 'split', activeHL = 'room';
const canvas = document.getElementById('gl');

const engine   = createEngine(canvas, document.getElementById('stage'));
const voidEnv  = createVoid(engine.scene);
const nodes    = createNodes({ scene: engine.scene, camera: engine.camera });
const orbs     = createOrbs({ scene: engine.scene, camera: engine.camera });
const progress = createProgress();
const circuit  = createCircuit({ voidEnv, nodes, orbs, getLevel: progress.get });
const player   = createPlayer({ scene: engine.scene, camera: engine.camera, dom: engine.renderer.domElement });
const director = createDirector({ voidEnv, nodes, circuit, camera: engine.camera, progress });
const interact = createInteract({ camera: engine.camera, voidEnv, nodes, orbs, circuit, getLevel: progress.get });
const attention = createAttention({ camera: engine.camera, getTargets: () => interact.targets(), getFocus: () => player.isFocusing() });
const staticFx = createStatic({ gl: canvas });

createHud(); createOverlay({ isVisible: engine.isVisible });

initModes(m => { mode = m; engine.setVisible(m !== 'blog'); if (m !== '3d') player.unlock();
  player.setBounds(m === '3d' ? voidEnv.bounds : null); director.setMode(m); bus.emit('mode:change', { mode: m }); });
initBlog(key => { activeHL = key; director.setSection(key); });
director.apply(); bus.emit('mode:change', { mode });

engine.onFrame((dt, t) => {
  economy.tick(dt);
  if (mode === '3d') { player.update(dt, t); if (player.isLocked()) attention.update(dt); }
  circuit.update(dt); nodes.update(dt, t); orbs.update(dt, t);
  voidEnv.update(dt, t); staticFx.update(dt); director.update(dt, t);
});
