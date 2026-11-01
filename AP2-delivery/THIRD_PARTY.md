# 资源来源

- `dist/vendor/MV.js`：Edward Angel 教材示例工具，原文件保留头部注释；下载自 https://raw.githubusercontent.com/esangel/WebGL/master/Common/MV.js ，来源仓库 https://github.com/esangel/WebGL 。未将其冒充自编矩阵库。
- 当前使用的 13 张纹理：**Solar System Scope / INOVE**，原作者页面 https://www.solarsystemscope.com/textures/ （可读镜像 https://play.solarsystemscope.com/textures/ ），授权 **CC BY 4.0**：https://creativecommons.org/licenses/by/4.0/ 。这些是经过调色、部分缺失地形补全的可视化地图，不是完全未经处理的观测数据。
- 原站下载接口返回 403，因此经公开分发镜像 https://github.com/Shriisoot/Planets-texture 获取同名文件。逐文件下载 URL、大小、SHA-256 保存在 `evidence/hd-assets.json`。磁盘上的图片保持下载内容不变，仅重命名。
- 已核验的实际分辨率（按解码后像素，不能依据文件名）：地球昼/夜、水星、火星为 8192×4096；太阳、木星、土星、金星为 4096×2048；月球、天王星、海王星、地球云层为 2048×1024；土星环为 8192×500 透明 PNG。全景球面最高上传 4K，单体近景按需上传原生分辨率，最高 8K。土星环运行时重采样为 8192×512，以支持 WebGL1 mipmap；磁盘原图保持不变。尺寸记录见 `evidence/texture-dimensions.json`、`hd-verification.json`。
- `venus_surface.jpg` 保留旧的程序资源键名，内容已换为金星大气云层贴图 `4k_venus_atmosphere.jpg`，不是金星地表雷达图。
- 旧版原创 `ring.jpg` 保留但不再被渲染器加载；现在使用 `ring.png`。旧示意纹理脚本保留作为示例，输出到单独的测试目录，不会覆盖新版资源。
- 本项目不使用 Three.js 渲染库；使用原生 WebGL API 与 MV.js。

## HD2 更新

太阳资源（镜像文件名为 8k_sun.jpg，实际 4096×2048）来自 Solar System Scope 的公开镜像：https://raw.githubusercontent.com/rajpatel5/Solar-System/master/8k_sun.jpg ，作者与 CC BY 4.0 署名同上。磁盘图片保持原文件；着色器对日面颜色与亮度做教学展示调整。

气态行星的程序云纹、大气辉光及天王星 5 条细环是视觉示意，非精密观测模型。天王星存在环与云层、海王星存在云带等外观背景参考：[NASA 天王星](https://science.nasa.gov/uranus/facts/) 与 [NASA 海王星](https://science.nasa.gov/neptune/neptune-facts/)。这些资料不意味着本项目人工增强的云纹就是实时观测。
