import * as THREE from 'three';

function cnv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function gridTex() {
  const [c, x] = cnv(256, 256);
  x.fillStyle = '#14171d'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#1c212a'; x.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, 256); x.stroke();
    x.beginPath(); x.moveTo(0, i + .5); x.lineTo(256, i + .5); x.stroke();
  }
  x.strokeStyle = '#232a35'; x.lineWidth = 4; x.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function signTex(text, color) {
  const [c, x] = cnv(512, 112);
  x.fillStyle = '#0b0d10'; x.fillRect(0, 0, 512, 112);
  x.strokeStyle = color; x.lineWidth = 3; x.strokeRect(4, 4, 504, 104);
  x.fillStyle = color;
  x.font = '600 42px "JetBrains Mono", monospace';
  x.textBaseline = 'middle';
  x.fillText(text, 24, 58);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function wrapTxt(x, text, px, py, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (x.measureText(test).width > maxW && line) {
      x.fillText(line, px, py); py += lh; line = w;
    } else line = test;
  }
  if (line) x.fillText(line, px, py);
}

export function nodeTex(text, color) {
  const [c, x] = cnv(320, 120);
  x.fillStyle = 'rgba(10,12,15,.78)'; x.fillRect(0, 0, 320, 120);
  x.strokeStyle = color; x.lineWidth = 3; x.strokeRect(3, 3, 314, 114);
  x.fillStyle = color;
  x.font = '600 44px "Tektur", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 160, 62);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function labelTex(text) {
  const [c, x] = cnv(640, 400);
  x.fillStyle = '#f2efe4'; x.fillRect(0, 0, 640, 400);
  x.fillStyle = '#e6e1d0'; x.fillRect(0, 0, 640, 62);
  x.fillStyle = '#b06a00';
  x.font = '600 24px "JetBrains Mono", monospace';
  x.fillText('USER // ВХОДЯЩЕЕ', 22, 40);
  x.fillStyle = '#171a1f';
  x.font = '500 42px "Golos Text", sans-serif';
  wrapTxt(x, text, 24, 128, 592, 54);
  x.strokeStyle = '#171a1f'; x.lineWidth = 4; x.strokeRect(6, 6, 628, 388);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
