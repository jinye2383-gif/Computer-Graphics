/** 几何算法：不依赖 DOM 或 WebGL，可独立测试。 */
(function (lab) {
  'use strict';

  const TRIANGLE = [[0, 0.88], [-0.7621023553, -0.44], [0.7621023553, -0.44]];
  const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  /** 深度 d 产生 3^d 个叶三角形，中央三角形不参与下一层递归。 */
  function subdivide(triangle, depth) {
    if (!Number.isInteger(depth) || depth < 0 || depth > 6) {
      throw new RangeError('递归深度必须是 0–6 的整数');
    }
    const leaves = [];
    function visit([a, b, c], level) {
      if (level === 0) {
        leaves.push([a, b, c]);
        return;
      }
      const ab = midpoint(a, b);
      const ac = midpoint(a, c);
      const bc = midpoint(b, c);
      visit([a, ab, ac], level - 1);
      visit([ab, b, bc], level - 1);
      visit([ac, bc, c], level - 1);
    }
    visit(triangle, depth);
    return leaves;
  }

  /** 同一组叶三角形：POINTS/TRIANGLES 使用 A,B,C；LINES 使用三对边端点。 */
  function triangleBuffer(triangles, mode) {
    if (!['points', 'lines', 'solid'].includes(mode)) {
      throw new RangeError('未知渲染模式');
    }
    const floatsPerTriangle = mode === 'lines' ? 12 : 6;
    const data = new Float32Array(triangles.length * floatsPerTriangle);
    let offset = 0;
    for (const [a, b, c] of triangles) {
      const vertices = mode === 'lines' ? [a, b, b, c, c, a] : [a, b, c];
      for (const [x, y] of vertices) {
        data[offset++] = x;
        data[offset++] = y;
      }
    }
    return data;
  }

  function polygonVertices(sides) {
    if (![3, 5, 6].includes(sides)) throw new RangeError('支持 3、5、6 边形');
    if (sides === 3) return TRIANGLE;
    return Array.from({length: sides}, (_, index) => {
      const angle = Math.PI / 2 + 2 * Math.PI * index / sides;
      return [0.82 * Math.cos(angle), 0.82 * Math.sin(angle)];
    });
  }

  // r 为新点到所选顶点的距离 / 旧点到所选顶点的距离。
  function chaosRatio(sides) {
    if (sides === 3) return 1 / 2;
    if (sides === 5) return (3 - Math.sqrt(5)) / 2;
    if (sides === 6) return 1 / 3;
    throw new RangeError('支持 3、5、6 边形');
  }

  function chaosGame(count, sides = 3, random = Math.random) {
    if (!Number.isInteger(count) || count < 1 || count > 100000) {
      throw new RangeError('点数必须是 1–100000 的整数');
    }
    const vertices = polygonVertices(sides);
    const ratio = chaosRatio(sides);
    const data = new Float32Array(count * 2);

    // 随机正权重凸组合保证初始点位于多边形内部。
    const weights = vertices.map(() => random() + Number.EPSILON);
    const sum = weights.reduce((total, value) => total + value, 0);
    let point = vertices.reduce((p, v, i) => [
      p[0] + v[0] * weights[i] / sum,
      p[1] + v[1] * weights[i] / sum
    ], [0, 0]);

    // 舍弃前 20 个过渡点；三角形时此公式即 p=(p+v)/2。
    for (let index = -20; index < count; index++) {
      const vertex = vertices[Math.min(sides - 1, Math.floor(random() * sides))];
      point = [
        vertex[0] + ratio * (point[0] - vertex[0]),
        vertex[1] + ratio * (point[1] - vertex[1])
      ];
      if (index >= 0) {
        data[index * 2] = point[0];
        data[index * 2 + 1] = point[1];
      }
    }
    return data;
  }

  lab.geometry = {TRIANGLE, subdivide, triangleBuffer, polygonVertices, chaosRatio, chaosGame};
})(window.FractalLab = window.FractalLab || {});
