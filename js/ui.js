/** 参数控件及显示；不生成几何，不直接调用 WebGL。 */
(function (lab) {
  'use strict';
  const byId = id => document.getElementById(id);
  function boundedInteger(input, min, max, fallback) {
    const value = Number(input.value);
    if (!Number.isFinite(value) || input.value.trim() === '') return fallback;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function bindUI(state, actions) {
    byId('chaos').onclick = () => actions.algorithm('chaos');
    byId('recursive').onclick = () => actions.algorithm('recursive');
    document.querySelectorAll('[data-mode]').forEach(button => {
      button.onclick = () => actions.mode(button.dataset.mode);
    });
    byId('count').oninput = event => {
      state.count = boundedInteger(event.target, 5000, 100000, state.count);
      actions.rebuild();
    };
    byId('depth').onchange = event => {
      state.depth = boundedInteger(event.target, 0, 6, state.depth);
      event.target.value = state.depth;
      actions.rebuild();
    };
    byId('size').oninput = event => {
      state.pointSize = Number(event.target.value);
      refreshUI(state);
    };
    byId('palette').onchange = event => {
      state.palette = event.target.value;
      refreshUI(state);
    };
    byId('polygon').onchange = event => {
      state.polygon = Number(event.target.value);
      actions.rebuild();
    };
    byId('pause').onclick = actions.pause;
    byId('restart').onclick = actions.restart;
    byId('reset').onclick = actions.reset;
    refreshUI(state);
  }

  function refreshUI(state) {
    const chaos = state.algorithm === 'chaos';
    const points = state.mode === 'points';
    ['chaos', 'recursive'].forEach(algorithm => {
      byId(algorithm).classList.toggle('active', state.algorithm === algorithm);
      byId(algorithm).setAttribute('aria-pressed', String(state.algorithm === algorithm));
    });
    document.querySelectorAll('[data-mode]').forEach(button => {
      button.classList.toggle('active', button.dataset.mode === state.mode);
      button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    });
    byId('count-control').hidden = !chaos;
    byId('depth-control').hidden = chaos;
    byId('size-control').hidden = !points;
    byId('polygon-control').hidden = !chaos;
    byId('count-value').textContent = state.count.toLocaleString();
    byId('depth-value').textContent = state.depth;
    byId('depth').value = state.depth;
    byId('size-value').textContent = state.pointSize.toFixed(1) + ' px';
    const notes = {
      points: '显示递归叶三角形的全部顶点。',
      lines: '把叶三角形的三条边组织为端点对。',
      solid: '每三个顶点构成一个叶三角形。'
    };
    byId('mode-note').textContent = chaos ? '随机迭代点以 gl.POINTS 绘制。' : notes[state.mode];
    const ratios = {3: '1/2', 5: '0.382', 6: '1/3'};
    byId('ratio-note').textContent = `到所选顶点的距离保留比例：${ratios[state.polygon]}。`;
    byId('figure-title').textContent = !chaos || state.polygon === 3
      ? 'Sierpinski 垫片' : state.polygon === 5 ? '五边形垫片' : '六边形垫片';
    byId('algorithm-badge').textContent = (chaos ? '混沌游戏' : '递归细分') + ' / '
      + {points: 'POINTS', lines: 'LINES', solid: 'TRIANGLES'}[state.mode];
    byId('structure').textContent = chaos
      ? `${state.polygon} 个顶点 · ${ratios[state.polygon]} 收缩`
      : `${3 ** state.depth} 个叶三角形 · 深度 ${state.depth}`;
    byId('observation').textContent = chaos
      ? '局部与整体，拥有相同的结构。' : '移去中央三角形，重复保留三个角落。';
    document.querySelectorAll('#swatches i').forEach((element, index) => {
      element.style.background = lab.rendering.PALETTES[state.palette][index];
    });
    byId('pause').hidden = !points;
    byId('restart').hidden = !points;
    byId('pause').innerHTML = (state.paused ? '继续生长' : '暂停生长') + ' <kbd>Space</kbd>';
  }

  function updateStats(state, total, shown, bytes) {
    byId('zoom').textContent = `缩放 ${state.zoom.toFixed(2)}×`;
    byId('status').textContent = state.mode !== 'points' ? '静态绘制'
      : shown >= total ? '生长完成' : state.paused ? '已暂停' : '逐点生长';
    byId('draw-count').textContent = state.mode === 'points'
      ? `${shown.toLocaleString()} / ${total.toLocaleString()} 点`
      : `${total.toLocaleString()} 顶点`;
    byId('progress-bar').style.width = (total ? shown / total * 100 : 0) + '%';
    byId('data-size').textContent = `${(bytes / 1024).toFixed(1)} KB · Float32Array → VBO`;
  }
  lab.ui = {bindUI, refreshUI, updateStats};
})(window.FractalLab);
