/** 入口与动画：应用状态封闭在函数内，全局只保留一个 FractalLab 接口。 */
(function (lab) {
  'use strict';
  const {TRIANGLE, subdivide, triangleBuffer, chaosGame} = lab.geometry;
  const {bindUI, refreshUI, updateStats} = lab.ui;
  const canvas = document.getElementById('canvas');
  const state = {
    algorithm: 'chaos', mode: 'points', count: 20000, depth: 5,
    pointSize: 2, palette: 'mint', polygon: 3,
    zoom: 1, pan: [0, 0], paused: false
  };

  function showError(message) {
    const error = document.getElementById('error');
    error.hidden = false;
    error.textContent = message;
    document.getElementById('gl-tag').textContent = 'WebGL 2.0 · 不可用';
  }

  try {
    const renderer = new lab.rendering.Renderer(canvas);
    let data;
    let leaves;
    let cachedDepth = -1;
    let shown = 0;
    let fractionalPoints = 0;
    let previousTime = performance.now();
    let contextLost = false;

    function rebuild() {
      if (state.algorithm === 'chaos') {
        data = chaosGame(state.count, state.polygon);
      } else {
        // 切换渲染图元时复用同一组叶三角形，仅改变缓冲区组织。
        if (cachedDepth !== state.depth) {
          leaves = subdivide(TRIANGLE, state.depth);
          cachedDepth = state.depth;
        }
        data = triangleBuffer(leaves, state.mode);
      }
      renderer.upload(data);
      shown = state.mode === 'points' ? 0 : renderer.total;
      fractionalPoints = 0;
      previousTime = performance.now();
      refreshUI(state);
      // 立即绘制和同步读数，使控件反馈无需等待下一帧。
      renderer.draw(state, shown);
      updateStats(state, renderer.total, shown, data.byteLength);
    }

    const actions = {
      rebuild,
      algorithm(value) {
        state.algorithm = value;
        if (value === 'chaos') state.mode = 'points';
        rebuild();
      },
      mode(value) {
        state.mode = value;
        if (value !== 'points') state.algorithm = 'recursive';
        rebuild();
      },
      pause() {
        if (state.mode !== 'points') return;
        state.paused = !state.paused;
        previousTime = performance.now();
        refreshUI(state);
      },
      restart() {
        shown = 0;
        fractionalPoints = 0;
        state.paused = false;
        previousTime = performance.now();
        refreshUI(state);
      },
      reset() {
        state.pan = [0, 0];
        state.zoom = 1;
      }
    };

    bindUI(state, actions);
    lab.bindInteraction(canvas, state, actions);
    rebuild();
    document.getElementById('gl-tag').textContent = 'WebGL 2.0 · 已连接';
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      contextLost = true;
      showError('WebGL 上下文丢失，请刷新页面重新加载。');
    });
    document.addEventListener('visibilitychange', () => { previousTime = performance.now(); });

    function frame(now) {
      if (contextLost) return;
      const delta = Math.max(0, Math.min(0.1, (now - previousTime) / 1000));
      previousTime = now;
      if (state.mode === 'points' && !state.paused && !document.hidden && shown < renderer.total) {
        fractionalPoints += delta * Math.max(300, renderer.total / 7);
        const increment = Math.floor(fractionalPoints);
        fractionalPoints -= increment;
        shown = Math.min(renderer.total, shown + increment);
      }
      renderer.draw(state, shown);
      updateStats(state, renderer.total, shown, data.byteLength);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  } catch (error) {
    showError(error.message);
    console.error(error);
  }
})(window.FractalLab);
