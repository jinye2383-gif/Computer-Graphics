# 教材 Common 工具库来源

下载日期：2026-10-10。

来源：Edward Angel 教材配套公开目录 <https://www.cs.unm.edu/~angel/WebGL/CODE/Common/>。

| 本地文件 | 原始 URL | 本项目改动 |
|---|---|---|
| initShaders.js | https://www.cs.unm.edu/~angel/WebGL/CODE/Common/initShaders.js | 无 |
| MV.js | https://www.cs.unm.edu/~angel/WebGL/CODE/Common/MV.js | 无 |
| webgl-utils.js | https://www.cs.unm.edu/~angel/WebGL/CODE/Common/webgl-utils.js | create3DContext 的 names 列表改为只包含 webgl2，增加一行改动说明 |
| README.txt | https://www.cs.unm.edu/~angel/WebGL/CODE/Common/README.txt | 无 |

保留原文件已有的说明和版权声明。webgl-utils.js 内含 Google 2010 BSD 风格版权和许可全文。没有为其他文件虚构许可证。

实际调用：renderer.js 使用 WebGLUtils.create3DContext、initShaders、vec2 和 flatten；并非仅放置未使用的工具文件。所有文件本地加载，无 CDN 依赖。
