// js/canvas.js
function snap(v) { return Math.floor(v) + .5; }

function drawExtendedGrid(tc, ps, ox, oy, cW, cH, lw) {
  tc.save();
  tc.strokeStyle = C().gridLine;
  tc.lineWidth = lw || 1;
  tc.beginPath();
  const sx = ((ox % ps) + ps) % ps - ps;
  const sy = ((oy % ps) + ps) % ps - ps;
  for (let x = sx; x <= cW + ps; x += ps) {
    const v = snap(x);
    tc.moveTo(v, 0);
    tc.lineTo(v, cH);
  }
  for (let y = sy; y <= cH + ps; y += ps) {
    const v = snap(y);
    tc.moveTo(0, v);
    tc.lineTo(cW, v);
  }
  tc.stroke();
  tc.restore();
}

function drawPerfectEllipse(tc, cx, cy, rx, ry, ps, ox, oy) {
  const scrCX = ox + cx * ps, scrCY = oy + cy * ps;
  const srX = rx * ps, srY = ry * ps;
  if (srX < 1 || srY < 1) return;
  const steps = Math.ceil(2 * Math.PI * Math.max(srX, srY) * 8);
  const seen = new Set();
  tc.fillStyle = C().circleArc;
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const sx = Math.floor(scrCX + Math.cos(a) * srX);
    const sy = Math.floor(scrCY + Math.sin(a) * srY);
    const k = sx * 65536 + sy;
    if (!seen.has(k)) {
      seen.add(k);
      tc.fillRect(sx, sy, 1, 1);
    }
  }
}

function drawCenterLines(tc, cx, cy, ps, ox, oy, cW, cH) {
  if (!showCenter || sliderActive) return;
  const isEX = (cx === Math.floor(cx));
  const isEY = (cy === Math.floor(cy));
  tc.save();
  tc.fillStyle = C().centerLine;
  const pw = Math.ceil(ps), ph = Math.ceil(ps);

  const addRow = (ry) => {
    const c1 = isEX ? Math.floor(ox + (Math.floor(cx) - 1) * ps) : Math.floor(ox + Math.floor(cx) * ps);
    const c2 = isEX ? Math.floor(ox + Math.floor(cx) * ps) : null;
    if (isEX) {
      tc.fillRect(0, ry, c1, ph);
      tc.fillRect(c1 + pw, ry, c2 - c1 - pw, ph);
      tc.fillRect(c2 + pw, ry, cW - c2 - pw, ph);
    } else {
      tc.fillRect(0, ry, c1, ph);
      tc.fillRect(c1 + pw, ry, cW - c1 - pw, ph);
    }
  };

  if (isEX) {
    tc.fillRect(Math.floor(ox + (Math.floor(cx) - 1) * ps), 0, pw, cH);
    tc.fillRect(Math.floor(ox + Math.floor(cx) * ps), 0, pw, cH);
  } else {
    tc.fillRect(Math.floor(ox + Math.floor(cx) * ps), 0, pw, cH);
  }
  if (isEY) {
    addRow(Math.floor(oy + (Math.floor(cy) - 1) * ps));
    addRow(Math.floor(oy + Math.floor(cy) * ps));
  } else {
    addRow(Math.floor(oy + Math.floor(cy) * ps));
  }
  tc.restore();
}

function renderViewport(tc, geo, f, cW, cH, doGrid, doCircle, doCenter, lw) {
  const { ps, Gc, Gr, ox, oy } = geo;
  tc.imageSmoothingEnabled = false;
  tc.fillStyle = C().bg;
  tc.fillRect(0, 0, cW, cH);
  tc.fillStyle = C().gridBg;
  tc.fillRect(0, 0, cW, cH);
  tc.fillStyle = C().pixel;
  for (let j = 0; j < Gr; j++)
    for (let i = 0; i < Gc; i++)
      if (f[j][i])
        tc.fillRect(Math.floor(ox + i * ps), Math.floor(oy + j * ps), Math.ceil(ps), Math.ceil(ps));

  if (doGrid) drawExtendedGrid(tc, ps, ox, oy, cW, cH, lw || 1);

  const cx = Gc / 2, cy = Gr / 2;
  const rx = isEllipse ? diamW / 2 : diamSize / 2;
  const ry = isEllipse ? diamH / 2 : diamSize / 2;

  if (doCircle) drawPerfectEllipse(tc, cx, cy, rx, ry, ps, ox, oy);
  if (doCenter) drawCenterLines(tc, cx, cy, ps, ox, oy, cW, cH);
}

function drawThumb(slEl, tcEl, boxEl, val, max, subLabel) {
  const wrap = slEl.parentElement;
  const r = wrap.getBoundingClientRect();
  if (!r.width) return;
  const T = getThumbPx(boxEl), dpr = window.devicePixelRatio || 1;
  tcEl.width = Math.round(r.width * dpr);
  tcEl.height = Math.round(r.height * dpr);
  tcEl.style.width = r.width + 'px';
  tcEl.style.height = r.height + 'px';

  const tc = tcEl.getContext('2d');
  tc.setTransform(dpr, 0, 0, dpr, 0, 0);
  tc.clearRect(0, 0, r.width, r.height);

  const trackW = r.width - T;
  const cx_t = T / 2 + ((val - parseInt(slEl.min)) / (parseInt(slEl.max) - parseInt(slEl.min))) * trackW;
  const cy_t = r.height / 2;
  const numStr = String(val);
  const maxW = T * 0.76;
  let fsMain = Math.max(4, Math.floor(T * 0.36));
  let fsSub = Math.max(3, Math.floor(T * 0.16));

  for (let iter = 0; iter < 12; iter++) {
    tc.font = `700 ${fsMain}px sans-serif`;
    const sw = tc.measureText('⌀').width;
    tc.font = `700 ${fsMain}px "JetBrains Mono",monospace`;
    const nw = tc.measureText(numStr).width;
    if (sw + nw <= maxW) break;
    fsMain = Math.max(4, Math.floor(fsMain * 0.85));
    fsSub = Math.max(3, Math.floor(fsSub * 0.85));
  }

  tc.font = `700 ${fsMain}px sans-serif`;
  const symW = tc.measureText('⌀').width;
  tc.font = `700 ${fsMain}px "JetBrains Mono",monospace`;
  const numW = tc.measureText(numStr).width;
  const sx = cx_t - (symW + numW) / 2;

  tc.textBaseline = 'middle';
  tc.fillStyle = '#ffffff';

  if (!subLabel) {
    tc.font = `700 ${fsMain}px sans-serif`;
    tc.fillText('⌀', sx, cy_t);
    tc.font = `700 ${fsMain}px "JetBrains Mono",monospace`;
    tc.fillText(numStr, sx + symW, cy_t);
  } else {
    const GAP = Math.max(2, Math.floor(T * 0.04));
    const halfSep = (fsMain + fsSub) / 2 + GAP;
    const yMain = cy_t - halfSep / 2;
    const ySub = cy_t + halfSep / 2;
    tc.font = `700 ${fsMain}px sans-serif`;
    tc.fillText('⌀', sx, yMain);
    tc.font = `700 ${fsMain}px "JetBrains Mono",monospace`;
    tc.fillText(numStr, sx + symW, yMain);
    tc.fillStyle = 'rgba(255,255,255,.65)';
    tc.textAlign = 'center';
    tc.font = `700 ${fsSub}px "JetBrains Mono",monospace`;
    tc.fillText(subLabel, cx_t, ySub);
  }
}

function drawAllThumbs() {
  if (!isEllipse) {
    drawThumb(slSize, tcSize, boxSize, diamSize, 32, `r${diamSize / 2}`);
  } else {
    drawThumb(slWidth, tcWidth, boxWidth, diamW, 32, null);
    drawThumb(slHeight, tcHeight, boxHeight, diamH, 32, null);
  }
}

function syncOverlay(v) {
  if (v) {
    if (is3D) {
      ovSym.textContent = '⌀';
      ovNum.textContent = String(diamSize);
      ovRad.textContent = `r${diamSize / 2}`;
    } else if (isEllipse) {
      ovSym.textContent = '';
      ovNum.textContent = `${diamW}×${diamH}`;
      ovRad.textContent = `rx${diamW / 2} ry${diamH / 2}`;
    } else {
      ovSym.textContent = '⌀';
      ovNum.textContent = String(diamSize);
      ovRad.textContent = `r${diamSize / 2}`;
    }
  } else {
    ovSym.textContent = '';
    ovNum.textContent = '';
    ovRad.textContent = '';
  }
  diamOverlay.classList.toggle('visible', v);
}

function draw() {
  if (is3D) return;
  applyLayout();
  const avail = getAvailableSpace();
  const geo = computeGeometry(avail.w, avail.h);
  if (!geo) {
    ctx.fillStyle = C().bg;
    ctx.fillRect(0, 0, mainCanvas.width || 1, mainCanvas.height || 1);
    return;
  }

  const { cW, cH, ps, Gc, Gr, ox, oy } = geo;
  mainCanvas.width = cW;
  mainCanvas.height = cH;
  mainCanvas.style.width = cW + 'px';
  mainCanvas.style.height = cH + 'px';

  if (isLS) {
    cFrame.style.width = '';
    cFrame.style.height = '';
  } else {
    cFrame.style.width = cW + 'px';
    cFrame.style.height = cH + 'px';
  }

  syncWidths(cW);
  fitTitle(cW);
  fitPillFonts();
  drawAllThumbs();
  syncOverlay(sliderActive);

  const cx = Gc / 2, cy = Gr / 2;
  const rx = isEllipse ? diamW / 2 : diamSize / 2;
  const ry = isEllipse ? diamH / 2 : diamSize / 2;

  const fRaw = computeFilled(Gc, Gr, cx, cy, rx, ry);
  const f = applyRenderMode(fRaw, Gc, Gr);

  _paintedCount = 0;
  for (let j = 0; j < Gr; j++)
    for (let i = 0; i < Gc; i++)
      if (f[j][i]) _paintedCount++;

  updateInfo(cW);

  if (showZoom && !isEllipse) {
    const m = 1.0, pad = getPad(diamSize);
    const srcSpan = Math.max((cx + m) - (pad - m), (cy + m) - (pad - m));
    const zps = Math.min(cW, cH) / srcSpan;
    const zGeo = { ps: zps, Gc, Gr, ox: -(pad - m) * zps, oy: -(pad - m) * zps };
    renderViewport(ctx, zGeo, f, cW, cH, showGrid, showCircle, showCenter);
  } else {
    renderViewport(ctx, geo, f, cW, cH, showGrid, showCircle, showCenter);
  }
}

function downloadPNG() {
  if (is3D) {
    const a = document.createElement('a');
    a.download = `voxel-sphere-d${diamSize}-${renderMode}.png`;
    a.href = threeCanvas.toDataURL('image/png');
    a.click();
    return;
  }

  const size = 4000;
  if (isEllipse) {
    const padX = getPad(diamW), padY = getPad(diamH);
    const Gc = diamW + padX * 2, Gr = diamH + padY * 2;
    const asp = Gc / Gr;
    const dlW = Math.round(asp >= 1 ? size : size * asp);
    const dlH = Math.round(asp >= 1 ? size / asp : size);
    const off = document.createElement('canvas');
    off.width = dlW; off.height = dlH;
    const otx = off.getContext('2d');
    otx.imageSmoothingEnabled = false;
    const ps = Math.min(dlW / Gc, dlH / Gr);
    const geo = { ps, Gc, Gr, ox: (dlW - Gc * ps) / 2, oy: (dlH - Gr * ps) / 2 };
    const fRaw = computeFilled(Gc, Gr, Gc / 2, Gr / 2, diamW / 2, diamH / 2);
    const f = applyRenderMode(fRaw, Gc, Gr);
    renderViewport(otx, geo, f, dlW, dlH, showGrid, showCircle, showCenter, 5);
    const a = document.createElement('a');
    a.download = `pixel-ellipse-${diamW}x${diamH}-${renderMode}-${algo}.png`;
    a.href = off.toDataURL('image/png');
    a.click();
  } else {
    const D = diamSize;
    if (!D) return;
    const p = getPad(D), G = D + p * 2;
    const off = document.createElement('canvas');
    off.width = off.height = size;
    const otx = off.getContext('2d');
    otx.imageSmoothingEnabled = false;
    const geo = { ps: size / G, Gc: G, Gr: G, ox: 0, oy: 0 };
    const fRaw = computeFilled(G, G, G / 2, G / 2, D / 2, D / 2);
    const f = applyRenderMode(fRaw, G, G);
    renderViewport(otx, geo, f, size, size, showGrid, showCircle, showCenter, 5);
    const a = document.createElement('a');
    a.download = `pixel-circle-d${D}-${renderMode}-${algo}.png`;
    a.href = off.toDataURL('image/png');
    a.click();
  }
}