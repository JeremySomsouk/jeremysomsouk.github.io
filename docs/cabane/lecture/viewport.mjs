// Mobile browser chrome and zoom can change the visible viewport independently
// of the layout viewport used by position: fixed.
export function trackReadingViewport(controls, view = window) {
  const viewport = view.visualViewport;
  if (!viewport) return; // CSS position: fixed remains the fallback.
  let frame = null;
  const update = () => {
    frame = null;
    controls.style.setProperty('--controls-top', `${viewport.offsetTop + viewport.height}px`);
    controls.style.setProperty('--controls-left', `${viewport.offsetLeft}px`);
    controls.style.setProperty('--controls-width', `${viewport.width}px`);
    controls.style.setProperty('--controls-bottom', 'auto');
    controls.style.setProperty('--controls-transform', 'translateY(-100%)');
  };
  const schedule = () => {
    if (frame === null) frame = view.requestAnimationFrame(update);
  };
  viewport.addEventListener('resize', schedule);
  viewport.addEventListener('scroll', schedule);
  view.addEventListener('resize', schedule);
  view.addEventListener('pageshow', schedule);
  update();
}
