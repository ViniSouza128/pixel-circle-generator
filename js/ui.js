function mkSl(sl, setter) {
  sl.addEventListener('mousedown', () => { sliderActive = true; refresh(); });
  sl.addEventListener('touchstart', () => { sliderActive = true; refresh(); }, { passive: true });
  sl.addEventListener('input', () => {
    setter(parseInt(sl.value));
    refresh();
  });
}

window.addEventListener('mouseup', () => { if (sliderActive) { sliderActive = false; refresh(); } });
window.addEventListener('touchend', () => { if (sliderActive) { sliderActive = false; refresh(); } });

mkSl(slSize, v => { diamSize = v; setTrack(slSize, v, 32); });
mkSl(slWidth, v => { diamW = v; setTrack(slWidth, v, 32); });
mkSl(slHeight, v => { diamH = v; setTrack(slHeight, v, 32); });

document.querySelectorAll('.rnd-opt').forEach(o => {
  o.addEventListener('click', () => {
    if (is3D && o.dataset.mode === 'thick') return;
    renderMode = o.dataset.mode;
    document.querySelectorAll('.rnd-opt').forEach(x => x.classList.remove('active'));
    o.classList.add('active');
    refresh();
  });
});

document.querySelectorAll('.algo-opt').forEach(o => {
  o.addEventListener('click', () => {
    if (is3D) return;
    algo = o.dataset.algo;
    document.querySelectorAll('.algo-opt').forEach(x => x.classList.remove('active'));
    o.classList.add('active');
    refresh();
  });
});

btnCircle.addEventListener('click', () => { 
  if (!is3D) { 
    showCircle = !showCircle; 
    btnCircle.classList.toggle('active', showCircle); 
    refresh(); 
  } 
});

btnZoom.addEventListener('click', () => { 
  if (is3D) {
    // Reset para vista isométrica
    theta3D = Math.PI / 4;
    phi3D = Math.atan(1 / Math.sqrt(2));
    distance3D = Math.max(35, diamSize * 1.85);
    if (typeof updateCamera3D === 'function') updateCamera3D();
    return;
  }
  showZoom = !showZoom;
  btnZoom.classList.toggle('active', showZoom);
  refresh();
});

btnCenter.addEventListener('click', () => {
  if (is3D) {
    window.toggleCenter3D();
    btnCenter.classList.toggle('active', showCenter3D);
    return;
  }
  showCenter = !showCenter;
  btnCenter.classList.toggle('active', showCenter);
  refresh();
});

btnGrid.addEventListener('click', () => {
  if (is3D) {
    showGrid3D = !showGrid3D;
    btnGrid.classList.toggle('active', showGrid3D);
    if (typeof window.toggleGrid3D === 'function') window.toggleGrid3D();
    return;
  }
  showGrid = !showGrid;
  btnGrid.classList.toggle('active', showGrid);
  refresh();
});

btnTheme.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  btnTheme.classList.toggle('active', !isDark);
  updateFavicon();
  if (is3D) updateThreeBackground();
  refresh();
});

btnDownload.addEventListener('click', downloadPNG);

infoBtnEl.addEventListener('click', toggleInfo);
infoChip.addEventListener('click', toggleInfo);

function toggleEllipseMode() {
  if (is3D) return;
  isEllipse = !isEllipse;
  bodyEl.classList.toggle('ellipse', isEllipse);
  syncTitleMode();
  updatePageTitle();
  if (isEllipse) {
    boxSize.style.display = 'none';
    boxWidth.style.display = '';
    boxHeight.style.display = '';
    setTrack(slWidth, diamW, 32);
    setTrack(slHeight, diamH, 32);
  } else {
    boxSize.style.display = '';
    boxWidth.style.display = 'none';
    boxHeight.style.display = 'none';
    setTrack(slSize, diamSize, 32);
  }
  refresh();
}

function toggle3DMode() {
  is3D = !is3D;
  bodyEl.classList.toggle('3d', is3D);

  if (is3D) {
    mainCanvas.style.display = 'none';
    threeCanvas.style.display = 'block';
    isEllipse = false;
    boxSize.style.display = '';
    boxWidth.style.display = 'none';
    boxHeight.style.display = 'none';
    setTrack(slSize, diamSize, 32);
    // btnZoom vira botão de Reset Isometric
    btnZoom.title = "Reset Isometric";
  } else {
    mainCanvas.style.display = 'block';
    threeCanvas.style.display = 'none';
  }

  syncTitleMode();
  updatePageTitle();
  refresh();

  if (is3D && !threeInitialized) initThreeD();
}

document.getElementById('modeToggle2D').addEventListener('click', toggle3DMode);
document.getElementById('modeToggleP').addEventListener('click', toggleEllipseMode);
document.getElementById('modeToggleLS').addEventListener('click', toggleEllipseMode);