// js/algorithms.js
function fillEuclidean(Gc, Gr, cx, cy, rx, ry, f) {
  const rx2 = rx * rx, ry2 = ry * ry;
  for (let j = 0; j < Gr; j++) {
    const dy = j + .5 - cy, dy2 = dy * dy;
    if (dy2 / ry2 >= 1) continue;
    const dxM = rx * Math.sqrt(1 - dy2 / ry2);
    const lo = Math.max(0, Math.ceil(cx - dxM - .5));
    const hi = Math.min(Gc - 1, Math.floor(cx + dxM - .5));
    for (let i = lo; i <= hi; i++) f[j][i] = 1;
  }
}

function fillBresenham(Gc, Gr, cx, cy, rx, ry, f) {
  const isCircle = Math.abs(rx - ry) < 0.01;
  const isEX = (cx === Math.floor(cx));
  const isEY = (cy === Math.floor(cy));

  if (isCircle) {
    const iR = Math.floor(rx);
    if (iR === 0) {
      if (!isEX) {
        const pi = Math.floor(cx), pj = Math.floor(cy);
        if (pi >= 0 && pi < Gc && pj >= 0 && pj < Gr) f[pj][pi] = 1;
      }
      return;
    }
    const rMin = new Int32Array(Gr).fill(Gc);
    const rMax = new Int32Array(Gr).fill(-1);
    const span = (row, lo, hi) => {
      if (row < 0 || row >= Gr || lo > hi) return;
      const l = Math.max(0, lo), r = Math.min(Gc - 1, hi);
      if (l > r) return;
      if (l < rMin[row]) rMin[row] = l;
      if (r > rMax[row]) rMax[row] = r;
    };

    let x = 0, y = iR, d = 1 - iR;
    while (x <= y) {
      if (isEX) {
        span(cy - y, cx - x, cx + x - 1);
        span(cy + y - 1, cx - x, cx + x - 1);
        span(cy - x - 1, cx - y, cx + y - 1);
        span(cy + x, cx - y, cx + y - 1);
      } else {
        const gcx = Math.floor(cx), gcy = Math.floor(cy);
        span(gcy + y, gcx - x, gcx + x);
        span(gcy - y, gcx - x, gcx + x);
        span(gcy + x, gcx - y, gcx + y);
        span(gcy - x, gcx - y, gcx + y);
      }
      if (d < 0) d += 2 * x + 3;
      else { d += 2 * (x - y) + 5; y--; }
      x++;
    }
    for (let j = 0; j < Gr; j++)
      for (let i = rMin[j]; i <= rMax[j]; i++)
        if (i >= 0 && i < Gc) f[j][i] = 1;
    return;
  }

  const a = Math.round(rx), b = Math.round(ry);
  if (a < 1 || b < 1) return;
  const a2 = a * a, b2 = b * b;
  const rMin = Array.from({ length: Gr }, () => Gc);
  const rMax = Array.from({ length: Gr }, () => -1);

  const addSpan = (row, lo, hi) => {
    const rr = Math.floor(row);
    if (rr < 0 || rr >= Gr) return;
    const l = Math.max(0, Math.floor(lo));
    const h = Math.min(Gc - 1, Math.floor(hi));
    if (l > h) return;
    if (l < rMin[rr]) rMin[rr] = l;
    if (h > rMax[rr]) rMax[rr] = h;
  };

  const plot = (dx, dy) => {
    let xl, xr, rowT, rowB;
    if (isEX) { xl = cx - dx; xr = cx + dx - 1; }
    else { xl = Math.floor(cx) - dx; xr = Math.floor(cx) + dx; }
    if (isEY) { rowT = cy - dy; rowB = cy + dy - 1; }
    else { rowT = Math.floor(cy) - dy; rowB = Math.floor(cy) + dy; }
    addSpan(rowT, xl, xr);
    if (rowT !== rowB) addSpan(rowB, xl, xr);
  };

  let x = 0, y = b;
  let p = Math.round(b2 - (a2 * b) + (a2 / 4));
  while (2 * b2 * x < 2 * a2 * y) {
    plot(x, y);
    if (p < 0) { x++; p += 2 * b2 * x + b2; }
    else { x++; y--; p += 2 * b2 * x - 2 * a2 * y + b2; }
  }
  p = Math.round(b2 * (x + 0.5) * (x + 0.5) + a2 * (y - 1) * (y - 1) - a2 * b2);
  while (y >= 0) {
    plot(x, y);
    if (p > 0) { y--; p -= 2 * a2 * y + a2; }
    else { y--; x++; p += 2 * b2 * x - 2 * a2 * y + a2; }
  }

  for (let j = 0; j < Gr; j++)
    for (let i = rMin[j]; i <= rMax[j]; i++)
      if (i >= 0 && i < Gc) f[j][i] = 1;
}

function fillThreshold(Gc, Gr, cx, cy, rx, ry, f) {
  const rx2 = rx * rx, ry2 = ry * ry;
  for (let j = 0; j < Gr; j++)
    for (let i = 0; i < Gc; i++) {
      const nx = Math.max(i, Math.min(i + 1, cx));
      const ny = Math.max(j, Math.min(j + 1, cy));
      if ((nx - cx) ** 2 / rx2 + (ny - cy) ** 2 / ry2 <= 1)
        f[j][i] = 1;
    }
}

function computeFilled(Gc, Gr, cx, cy, rx, ry) {
  const f = Array.from({ length: Gr }, () => new Uint8Array(Gc));
  if (algo === 'euclidean') fillEuclidean(Gc, Gr, cx, cy, rx, ry, f);
  else if (algo === 'bresenham') fillBresenham(Gc, Gr, cx, cy, rx, ry, f);
  else fillThreshold(Gc, Gr, cx, cy, rx, ry, f);
  return f;
}

function applyRenderMode(f, Gc, Gr) {
  if (renderMode === 'filled') return f;

  const b = Array.from({ length: Gr }, () => new Uint8Array(Gc));
  for (let j = 0; j < Gr; j++)
    for (let i = 0; i < Gc; i++) {
      if (!f[j][i]) continue;
      if (j === 0 || !f[j - 1][i] ||
          j === Gr - 1 || !f[j + 1][i] ||
          i === 0 || !f[j][i - 1] ||
          i === Gc - 1 || !f[j][i + 1])
        b[j][i] = 1;
    }

  if (renderMode === 'thin') return b;

  const t = Array.from({ length: Gr }, () => new Uint8Array(Gc));
  for (let j = 0; j < Gr; j++)
    for (let i = 0; i < Gc; i++) {
      if (!f[j][i]) continue;
      if (b[j][i]) { t[j][i] = 1; continue; }
      const hH = (i > 0 && b[j][i - 1]) || (i < Gc - 1 && b[j][i + 1]);
      const hV = (j > 0 && b[j - 1][i]) || (j < Gr - 1 && b[j + 1][i]);
      if (hH && hV) t[j][i] = 1;
    }
  return t;
}