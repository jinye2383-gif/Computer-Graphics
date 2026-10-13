/** WebGL 2.0 渲染：只负责上下文、着色器、VBO 和 drawArrays。 */
(function (lab) {
  'use strict';
  const PALETTES = {
    mint: ['#53b8ad', '#65dfba', '#d7f8ba'],
    sunset: ['#e37bba', '#ff936b', '#ffd084'],
    ice: ['#867efa', '#70c6ff', '#bcefff']
  };
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = window.WebGLUtils.create3DContext(canvas, {
        alpha: true, antialias: true, preserveDrawingBuffer: true
      });
      const gl = this.gl;
      if (!window.WebGL2RenderingContext || !(gl instanceof window.WebGL2RenderingContext)) {
        throw new Error('无法创建 WebGL 2.0 上下文。请使用支持 WebGL 2.0 的浏览器并启用硬件加速。');
      }
      this.program = window.initShaders(gl, 'vertex-shader', 'fragment-shader');
      if (this.program === -1) throw new Error('着色器编译或链接失败，请查看浏览器提示。');
      gl.useProgram(this.program);
      this.buffer = gl.createBuffer();
      this.position = gl.getAttribLocation(this.program, 'a_position');
      this.uniforms = Object.fromEntries(
        ['scale', 'pan', 'zoom', 'size', 'bottom', 'middle', 'top', 'points']
          .map(name => [name, gl.getUniformLocation(this.program, 'u_' + name)])
      );
      this.pointRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      this.total = 0;
    }

    upload(data) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      this.total = data.length / 2;
    }

    resize() {
      const bounds = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      return {width, height, dpr, scale: [Math.min(1, height / width), Math.min(1, width / height)]};
    }

    draw(state, count) {
      const gl = this.gl;
      const u = this.uniforms;
      const {width, height, dpr, scale} = this.resize();
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.position);
      gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);

      // 教材 MV.js：把二维向量转换为 uniform 所需的 Float32Array。
      gl.uniform2fv(u.scale, window.flatten(window.vec2(...scale)));
      gl.uniform2fv(u.pan, window.flatten(window.vec2(...state.pan)));
      gl.uniform1f(u.zoom, state.zoom);
      gl.uniform1f(u.size, Math.min(this.pointRange[1], Math.max(this.pointRange[0], state.pointSize * dpr)));
      const colors = PALETTES[state.palette];
      ['bottom', 'middle', 'top'].forEach((name, index) => gl.uniform3fv(u[name], rgb(colors[index])));
      gl.uniform1i(u.points, state.mode === 'points');
      const primitive = {points: gl.POINTS, lines: gl.LINES, solid: gl.TRIANGLES}[state.mode];
      gl.drawArrays(primitive, 0, Math.min(this.total, count));
    }
  }
  lab.rendering = {Renderer, PALETTES};
})(window.FractalLab);
