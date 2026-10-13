/** 鼠标和键盘；通过 actions 修改应用参数。 */
(function (lab) {
  'use strict';
  function bindInteraction(canvas, state, actions) {
    let dragging = false;
    let previous = null;

    // 屏幕像素 -> 长宽比校正之前的坐标，与顶点着色器保持一致。
    function coordinate(event) {
      const rect = canvas.getBoundingClientRect();
      const sx = Math.min(1, rect.height / rect.width);
      const sy = Math.min(1, rect.width / rect.height);
      return [
        (2 * (event.clientX - rect.left) / rect.width - 1) / sx,
        (1 - 2 * (event.clientY - rect.top) / rect.height) / sy
      ];
    }
    function move(event) {
      if (!dragging) return;
      const current = coordinate(event);
      state.pan[0] += current[0] - previous[0];
      state.pan[1] += current[1] - previous[1];
      previous = current;
    }
    function stop() {
      dragging = false;
      canvas.classList.remove('dragging');
    }
    canvas.addEventListener('mousedown', event => {
      if (event.button !== 0) return;
      dragging = true;
      previous = coordinate(event);
      canvas.classList.add('dragging');
      canvas.focus();
      event.preventDefault();
    });
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    window.addEventListener('blur', stop);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const anchor = coordinate(event);
      const oldZoom = state.zoom;
      const delta = Math.max(-300, Math.min(300, event.deltaY));
      state.zoom = Math.max(0.2, Math.min(20, oldZoom * Math.exp(-delta * 0.0015)));
      // 缩放前后鼠标指向的几何点保持不动。
      state.pan = anchor.map((value, index) =>
        value - (value - state.pan[index]) * state.zoom / oldZoom
      );
    }, {passive: false});

    window.addEventListener('keydown', event => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      if (event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
      const mode = {'1': 'points', '2': 'lines', '3': 'solid'}[event.key];
      if (mode) {
        event.preventDefault();
        actions.mode(mode);
      } else if (event.code === 'Space' && !event.target.closest('button')) {
        event.preventDefault();
        actions.pause();
      }
    });
  }
  lab.bindInteraction = bindInteraction;
})(window.FractalLab);
