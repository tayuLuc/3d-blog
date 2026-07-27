import { bus } from '../core/bus.js';

export function createOverlay({ isVisible }) {
  const el = document.getElementById('overlay');
  const isTouch = matchMedia('(pointer:coarse)').matches;
  let locked = false;

  if (isTouch) {
    document.getElementById('ovTitle').innerHTML = '<i class="pulse"></i>3D — С ДЕСКТОПА';
    document.getElementById('ovKeys').textContent = 'Нужны клавиатура и мышь: WASD + ЛКМ.';
    el.style.cursor = 'default';
  }

  el.addEventListener('click', () => { if (!isTouch) bus.emit('lock:request'); });
  bus.on('lock:change', ({ locked: l }) => {
    locked = l;
    if (locked) el.classList.add('hidden');
    else if (isVisible()) el.classList.remove('hidden');
  });
  bus.on('mode:change', ({ mode }) => {
    if (mode === '3d' && !locked) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}
