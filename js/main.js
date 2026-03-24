// js/main.js
let _roDraw = null;
const roDraw = () => {
  if (_roDraw) cancelAnimationFrame(_roDraw);
  _roDraw = requestAnimationFrame(refresh);
};

new ResizeObserver(roDraw).observe(cWrap);

[document.getElementById('sw-size'),
 document.getElementById('sw-width'),
 document.getElementById('sw-height')]
  .forEach(el => {
    if (el) {
      new ResizeObserver(() => {
        if (_roDraw) cancelAnimationFrame(_roDraw);
        _roDraw = requestAnimationFrame(drawAllThumbs);
      }).observe(el);
    }
  });

window.addEventListener('resize', roDraw);

setTrack(slSize, diamSize, 32);
setTrack(slWidth, diamW, 32);
setTrack(slHeight, diamH, 32);

syncTitleMode();
updatePageTitle();

requestAnimationFrame(() => {
  requestAnimationFrame(refresh);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js', {
    scope: './'
  });
}
