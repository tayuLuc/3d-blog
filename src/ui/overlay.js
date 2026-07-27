import { bus } from '../core/bus.js';

export function createOverlay({ isVisible }) {
  const el = document.getElementById('overlay');
  const isTouch = matchMedia('(pointer:coarse)').matches;

  if (isTouch) {
    document.getElementById('ovTitle').innerHTML = '<i class="pulse"></i>3D — С ДЕСКТОПА';
    document.getElementById('ovKeys').textContent = 'Нужны клавиатура и мышь: WASD + ЛКМ.';
    el.style.cursor = 'default';
  }

  el.addEventListener('click', () => { if (!isTouch) bus.emit('lock:request'); });
  bus.on('lock:change', ({ locked }) => {
    if (locked) el.classList.add('hidden');
    else if (isVisible()) el.classList.remove('hidden');
  });
}
