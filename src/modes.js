let mode = 'split';
const btns = [...document.querySelectorAll('.mode-btn')];
const ind = document.getElementById('modeInd');

export const getMode = () => mode;

export function initModes(onChange) {
  function place() {
    const b = btns.find(x => x.classList.contains('is-active'));
    if (!b) return;
    ind.style.left = b.offsetLeft + 'px';
    ind.style.width = b.offsetWidth + 'px';
  }
  function set(m) {
    mode = m;
    document.body.dataset.mode = m;
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === m));
    place();
    onChange?.(m);
  }
  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.mode)));
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Digit1') set('blog');
    if (e.code === 'Digit2') set('split');
    if (e.code === 'Digit3') set('3d');
  });
  addEventListener('resize', place);
  place();
  if (document.fonts?.ready) document.fonts.ready.then(place);
}
