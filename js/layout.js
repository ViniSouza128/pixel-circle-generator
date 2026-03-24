// js/layout.js
function computeLayoutScores() {
  const W = window.innerWidth, H = window.innerHeight;
  const ptHdrH = H * 0.045;
  const ptPadB = H * 0.02;
  const ptRowsH = 52 + 52, ptGapsH = 8 * 5, ptSlider = 60 + 38;
  const ptFreeH = H - ptHdrH - ptPadB - ptRowsH - ptGapsH - ptSlider;
  const ptSide = Math.min(W * .96, ptFreeH);

  const sideCol = Math.min(82, Math.max(50, W * .07));
  const lsSideW = sideCol * 2 + W * .04 + 8 * 2;
  const lsFreeW = W - lsSideW;
  const lsFreeH = H - H * .03 - H * .04 - 8 - 45 - 38 - 8;

  return { pt: ptSide, ls: Math.min(lsFreeW, lsFreeH) };
}

function getLandscapeAvailW() {
  const W = window.innerWidth;
  const sideCol = Math.min(82, Math.max(50, W * .07));
  const pad = W * .04;
  const gaps = 8 * 2;
  const maxCanvasW = W - sideCol * 2 - pad - gaps;
  return Math.max(maxCanvasW, 60);
}

function applyLayout() {
  const { pt, ls } = computeLayoutScores();
  const HYST = 6;
  if (!isLS && ls > pt + HYST) {
    isLS = true;
    bodyEl.classList.add('ls');
  } else if (isLS && pt > ls + HYST) {
    isLS = false;
    bodyEl.classList.remove('ls');
  }
}

function computeGeometry(availW, availH) {
  if (isEllipse) {
    const padX = getPad(diamW), padY = getPad(diamH);
    const Gc = diamW + padX * 2, Gr = diamH + padY * 2;
    const cW = Math.max(availW, 60), cH = Math.max(availH, 40);
    const ps = Math.min(cW / Gc, cH / Gr);
    return { ps, Gc, Gr, ox: (cW - Gc * ps) / 2, oy: (cH - Gr * ps) / 2, cW, cH };
  } else {
    const D = diamSize;
    if (!D) return null;
    const p = getPad(D), G = D + p * 2;
    const cW = Math.max(availW, 60), cH = Math.max(availH, 40);
    const ps = Math.min(cW / G, cH / G);
    return { ps, Gc: G, Gr: G, ox: (cW - G * ps) / 2, oy: (cH - G * ps) / 2, cW, cH };
  }
}

function getAvailableSpace() {
  if (isLS) {
    mainCanvas.style.width = '0';
    mainCanvas.style.height = '0';
    cFrame.style.width = '';
    cFrame.style.height = '';
    const r = cWrap.getBoundingClientRect();
    const capW = getLandscapeAvailW();
    return { w: Math.min(Math.floor(r.width), capW), h: Math.floor(r.height) };
  } else {
    cFrame.style.width = '0px';
    cFrame.style.height = '0px';
    const r = cWrap.getBoundingClientRect();
    const bodyW = Math.floor(window.innerWidth * .96) - 4;
    const availH = Math.max(Math.floor(r.height) - 2, 60);
    return { w: bodyW, h: availH };
  }
}

function syncWidths(cW) {
  if (!isLS) {
    const bodyW = Math.floor(window.innerWidth * .96) - 4;
    const ws = bodyW + 'px';
    renderRow.style.width = ws;
    algoRow.style.width = ws;
    boxesRow.style.width = ws;

    const titleBox = document.getElementById('title-box');
    if (titleBox) titleBox.style.width = ws;
  } else {
    renderRow.style.width = '';
    algoRow.style.width = '';
    boxesRow.style.width = '';
  }
}

function fitTitle(cW) {
  const el = isLS ? h1Ls : h1p;
  const maxH = Math.min(Math.floor(window.innerHeight * .035), 40);
  const box = isLS ? document.getElementById('title-box-ls') : document.getElementById('title-box');
  const padding = 40;
  const targetW = (box?.clientWidth || cW) - padding;
  if (!targetW) return;

  el.style.fontSize = maxH + 'px';
  if (el.scrollWidth <= targetW) return;

  let lo = 4, hi = maxH;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    el.style.fontSize = m + 'px';
    el.scrollWidth <= targetW ? (lo = m) : (hi = m);
  }
  el.style.fontSize = lo + 'px';
}

function fitPillFonts() {
  const IDEAL = isLS ? 14 : 12, MIN = 6;
  document.querySelectorAll('.rnd-opt,.algo-opt').forEach(opt => {
    const nm = opt.querySelector('.rnd-name,.algo-name');
    if (!nm) return;
    const avail = opt.getBoundingClientRect().width - 8;
    if (avail <= 0) return;
    nm.style.fontSize = IDEAL + 'px';
    if (nm.scrollWidth <= avail) return;
    let lo = MIN, hi = IDEAL;
    for (let i = 0; i < 15; i++) {
      const m = (lo + hi) / 2;
      nm.style.fontSize = m + 'px';
      nm.scrollWidth <= avail ? (lo = m) : (hi = m);
    }
    nm.style.fontSize = lo + 'px';
  });
}

function updateInfo(cW) {
  const btnPx = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--btn')) || 44;
  const chipH = btnPx * 2;
  infoChip.style.height = chipH + 'px';
  infoChip.style.maxHeight = chipH + 'px';

  const brEdge = cW - 8 - btnPx;
  const chipLeft = 8 + btnPx + 8;
  const chipW = Math.max(brEdge - 8 - chipLeft, 60);
  infoChip.style.width = chipW + 'px';

  let lines = [];
  if (is3D) {
    lines = [
      `Diameter: ${diamSize}`,
      `Radius: ${Math.round(diamSize / 2)}`,
      `Volume: ${countVolume()}`,
      `Mode: ${renderMode.toUpperCase()}`
    ];
  } else if (isEllipse) {
    const area = countArea();
    lines = [`Width: ${diamW}`, `Height: ${diamH}`, areaLine(area), `Algorithm: ${ALGO_FULL[algo]}`];
  } else {
    const area = countArea();
    lines = [`Diameter: ${diamSize}`, `Radius: ${diamSize / 2}`, areaLine(area), `Algorithm: ${ALGO_FULL[algo]}`];
  }

  function areaLine(area) {
    if (area < 65) return `Area: ${area}`;
    const mult = Math.floor(area / 64);
    const rem = area % 64;
    const m = '<span class="area-muted">'; const me = '</span>';
    if (rem === 0) return `Area: ${area} ${m}(or ${me}${mult}${m}×64${me})`;
    return `Area: ${area} ${m}(or ${me}${mult}${m}×64+${me}${rem}${m})`;
  }

  const testEl = document.createElement('span');
  testEl.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-family:"JetBrains Mono",monospace;font-weight:700;letter-spacing:0.04em;';
  document.body.appendChild(testEl);
  let bestFs = 8;
  for (let fs = 18; fs >= 6; fs -= 0.5) {
    if (fs * 1.6 * 4 > chipH) continue;
    testEl.style.fontSize = fs + 'px';
    testEl.textContent = lines[lines.length - 1];
    if (testEl.scrollWidth <= chipW - 22) { bestFs = fs; break; }
  }
  document.body.removeChild(testEl);

  infoChip.style.fontSize = bestFs + 'px';
  infoChip.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
}

function toggleInfo() {
  infoExpanded = !infoExpanded;
  infoBtnEl.style.display = infoExpanded ? 'none' : 'flex';
  if (infoExpanded) {
    infoChip.classList.add('open');
    infoChip.style.display = 'flex';
  } else {
    infoChip.classList.remove('open');
    infoChip.style.display = 'none';
  }
}