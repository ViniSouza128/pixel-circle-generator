// js/state.js
function updatePageTitle() {
  document.title = is3D 
    ? '3D Pixel Sphere Generator' 
    : (isEllipse ? '2D Pixel Ellipse Generator' : '2D Pixel Circle Generator');
}

const faviconEl = document.getElementById('favicon');
function updateFavicon() {
  if (!faviconEl) return;
  faviconEl.href = (isDark ? 'favicon_dark.png' : 'favicon_light.png') + '?v=' + Date.now();
}

window.addEventListener('error', e => {
  if (e.message && e.message.includes('ResizeObserver')) e.stopImmediatePropagation();
});

const mainCanvas = document.getElementById('c');
const threeCanvas = document.getElementById('three-canvas');
const ctx = mainCanvas.getContext('2d');
const cFrame = document.getElementById('canvas-frame');
const cWrap = document.getElementById('canvas-wrap');
const renderRow = document.getElementById('render-row');
const algoRow = document.getElementById('algo-row');
const boxesRow = document.getElementById('diam-boxes-row');
const boxSize = document.getElementById('box-size');
const boxWidth = document.getElementById('box-width');
const boxHeight = document.getElementById('box-height');
const slSize = document.getElementById('slSize');
const slWidth = document.getElementById('slWidth');
const slHeight = document.getElementById('slHeight');
const tcSize = document.getElementById('tc-size');
const tcWidth = document.getElementById('tc-width');
const tcHeight = document.getElementById('tc-height');
const infoBtnEl = document.getElementById('info-btn');
const infoChip = document.getElementById('info-chip');
const diamOverlay = document.getElementById('diam-overlay');
const ovNum = document.getElementById('ov-num');
const ovSym = diamOverlay.querySelector('.sym');
const ovRad = document.getElementById('ov-rad');
const h1p = document.getElementById('h1p');
const h1Ls = document.getElementById('h1-ls');
const btnCircle = document.getElementById('btnCircle');
const btnZoom = document.getElementById('btnZoom');
const btnTheme = document.getElementById('btnTheme');
const btnDownload = document.getElementById('btnDownload');
const btnCenter = document.getElementById('btnCenter');
const btnGrid = document.getElementById('btnGrid');
const bodyEl = document.body;

const ALGO_FULL = {
  euclidean: 'Euclidean Distance',
  bresenham: 'Midpoint Circle (Bresenham)',
  threshold: 'Threshold Coverage'
};

const THM = {
  dark: { bg: '#0b0b0f', gridBg: '#13131c', gridLine: '#1e1e2c', pixel: '#e03030', circleArc: '#ff9bbc', centerLine: 'rgba(200,140,140,0.16)' },
  light: { bg: '#f2ede2', gridBg: '#ece8de', gridLine: '#bfb8a8', pixel: '#c82020', circleArc: '#7a1040', centerLine: 'rgba(100,30,30,0.22)' }
};

let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
let is3D = false;
let isEllipse = false;
let diamSize = 16;
let diamW = 20;
let diamH = 12;
let algo = 'euclidean';
let renderMode = 'filled';
let showCircle = false;
let showZoom = false;
let showCenter = false;
let showGrid = true;
let sliderActive = false;
let infoExpanded = false;
let isLS = false;
let _paintedCount = 0;
let _voxelCount = 0;

btnTheme.classList.toggle('active', !isDark);
updateFavicon();

const C = () => isDark ? THM.dark : THM.light;

function getPad(d) { return Math.max(3, Math.ceil(d * .15)); }
function countArea() { return _paintedCount; }
function countVolume() { return _voxelCount; }

function setTrack(sl, v, max) {
  const min = parseInt(sl.min) || 0;
  const pct = (v - min) / (max - min);
  const thumb = parseInt(getComputedStyle(sl).getPropertyValue('--thumb')) || 60;
  const track = sl.offsetWidth - thumb;
  const px = pct * track + thumb / 2;
  const finalPct = (px / sl.offsetWidth) * 100;
  sl.style.setProperty('--pct', finalPct + '%');
}

function getThumbPx(box) {
  return parseInt(getComputedStyle(box).getPropertyValue('--thumb')) || 60;
}

function buildModeWord(word) {
  return Array.from(word).map((ch, i) => {
    const s = document.createElement('span');
    s.className = 'mw-letter';
    s.textContent = ch;
    s.style.setProperty('--i', String(i));
    return s;
  });
}

function syncTitleMode() {
  const twoD = document.getElementById('modeToggle2D');
  const wordP = document.getElementById('modeToggleP');
  const wordLS = document.getElementById('modeToggleLS');

  if (is3D) {
    twoD.innerHTML = ''; buildModeWord('3D').forEach(s => twoD.appendChild(s));
    const sphere = 'Sphere';
    wordP.innerHTML = ''; buildModeWord(sphere).forEach(s => wordP.appendChild(s));
    wordLS.innerHTML = ''; buildModeWord(sphere).forEach(s => wordLS.appendChild(s));
  } else {
    twoD.innerHTML = ''; buildModeWord('2D').forEach(s => twoD.appendChild(s));
    const w = isEllipse ? 'Ellipse' : 'Circle';
    wordP.innerHTML = ''; buildModeWord(w).forEach(s => wordP.appendChild(s));
    wordLS.innerHTML = ''; buildModeWord(w).forEach(s => wordLS.appendChild(s));
  }
}

function refresh() {
  if (is3D) {
    if (typeof generateVoxels3D === 'function') generateVoxels3D();
    const cW = threeCanvas.clientWidth;
    updateInfo(cW);
    syncOverlay(sliderActive);
  } else {
    draw();
  }
}