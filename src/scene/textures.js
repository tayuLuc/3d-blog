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

export function stampTex(text = '✓ ПРОЧИТАНО', color = '#4dd8c7') {
  const [c, x] = cnv(256, 96);
  x.fillStyle = 'rgba(6,26,24,.85)'; x.fillRect(0, 0, 256, 96);
  x.strokeStyle = color; x.lineWidth = 4; x.strokeRect(4, 4, 248, 88);
  x.fillStyle = color;
  x.font = '600 34px "JetBrains Mono", monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function pageTex(q, n) {
  const [c, x] = cnv(512, 704);
  x.fillStyle = '#f2efe4'; x.fillRect(0, 0, 512, 704);
  x.fillStyle = '#e6e1d0'; x.fillRect(0, 0, 512, 74);
  x.fillStyle = '#b06a00';
  x.font = '600 26px "JetBrains Mono", monospace';
  x.fillText(`ВХОДЯЩЕЕ // №${n}`, 24, 48);
  x.strokeStyle = '#171a1f'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, 74); x.lineTo(512, 74); x.stroke();
  x.fillStyle = '#171a1f';
  x.font = '500 38px "JetBrains Mono", monospace';
  wrapTxt(x, q, 26, 140, 460, 52);
  x.fillStyle = '#8a8574';
  x.font = '400 20px "JetBrains Mono", monospace';
  x.fillText('chat/completions · message', 26, 668);
  x.strokeStyle = '#171a1f'; x.lineWidth = 4;
  x.strokeRect(6, 6, 500, 692);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function pageBackTex() {
  const [c, x] = cnv(512, 704);
  x.fillStyle = '#f2efe4'; x.fillRect(0, 0, 512, 704);
  x.fillStyle = '#e6e1d0'; x.fillRect(0, 0, 512, 74);
  x.fillStyle = '#b06a00';
  x.font = '600 26px "JetBrains Mono", monospace';
  x.fillText('ВХОДЯЩЕЕ // №?', 24, 48);
  x.fillStyle = '#171a1f';
  for (let y = 120; y < 600; y += 52) {
    x.fillRect(26, y, 180 + Math.random() * 260, 30);
  }
  x.strokeStyle = '#171a1f'; x.lineWidth = 4;
  x.strokeRect(6, 6, 500, 692);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function optionTex(text, color = '#f2efe4') {
  const [c, x] = cnv(420, 140);
  x.fillStyle = 'rgba(10,12,15,.85)'; x.fillRect(0, 0, 420, 140);
  x.strokeStyle = color; x.lineWidth = 3; x.strokeRect(3, 3, 414, 134);
  x.fillStyle = color;
  x.font = '500 34px "Golos Text", sans-serif';
  if (x.measureText(text).width > 380) x.font = '500 26px "Golos Text", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 210, 72, 396);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
