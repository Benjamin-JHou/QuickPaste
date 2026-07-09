[English](README.md) · **中文** · [한국어](README-ko.md)

---

# QuickPaste · 快贴

> 扫一下即用 · 跨设备文本、图片、视频临时互传 · WebRTC P2P 直连 · 免登录 · GitHub Pages 部署。

## ✨ 特性

- 🚀 **零账号** — 打开页面，输入房间号或扫码即用
- 🌐 **真·跨平台** — iOS / Android / Windows / macOS / Linux 浏览器互传
- 📷 **文本 + 图片 + 视频** — 文字秒到；图片/视频支持压缩或原图无损发送
- ⚡ **P2P 直连** — WebRTC DataChannel 传输，内容不过任何服务器
- 🪶 **免下载** — PWA 可「添加到主屏」，像原生应用一样启动
- 🔒 **隐私优先** — 房间关闭即清空，无后端记录
- 🌐 **平台传输** — 有浏览器就能用，iOS/Android/Windows/macOS/Linux，无需下载 App
- 🔐 **隐私传输** — 端对端加密，无日志，无服务器存储。传输内容只在你的设备之间
- 🕐 **临时传输** — 数据仅存于会话期间。关闭房间即消失，不留任何痕迹
- 🖼 **图片原图无损** — 可切换原图模式，保留完整分辨率、无压缩
- 🎬 **视频传输** — 支持发送视频文件，压缩或原画质两种模式

## 🌏 多语言

支持 **English**（默认）、**中文**、**한국어** 三个语言，页面顶部语言栏随时切换。

| URL | 语言 |
|-----|------|
| `/` | English（默认） |
| `/zh/` | 中文 |
| `/ko/` | 한국어 |
| [`README.md`](README.md) · [`README-en.md`](README-en.md) · [`README-ko.md`](README-ko.md) | 三语文档 |

## 🧬 技术栈

| 角色 | 方案 |
| --- | --- |
| 前端 | 纯 HTML + CSS + 原生 JS（无构建步骤） |
| P2P 传输 | WebRTC DataChannel |
| 二进制分片传输 | 64 KB 分片，支持图片原图 / 视频 |
| 信令 | PeerJS Cloud（公共 0.peerjs.com） |
| 二维码 | qrcode-generator |
| 部署 | GitHub Pages + GitHub Actions |
| PWA | 每语独立 manifest + Service Worker（离线缓存） |

## 📁 项目结构

```
QuickPaste/
├── index.html              # 主入口（含 manifest / SW 注册）
├── app.js                  # 核心逻辑（WebRTC + 房间管理 + 二进制传输）
├── style.css               # 样式（移动优先 + 暗色 UI，支持两种主题）
├── manifest.json           # EN PWA 配置
├── sw.js                   # Service Worker（离线缓存）
├── icons/                  # PWA 图标（192/512/maskable/apple/favicon）
├── .github/workflows/
│   └── deploy.yml          # 自动部署到 GitHub Pages
├── .nojekyll               # 禁用 Jekyll（直接提供静态文件）
├── README.md               # 英文文档（默认）
├── README-en.md            # 本文件，中文文档
├── README-ko.md            # 韩文文档
├── zh/                     # 中文版本（index.html, app.js, manifest, sw, icons, tutorial）
└── ko/                     # 韩文版本（index.html, app.js, manifest, sw, icons, tutorial）
```

## 🚀 部署到 GitHub Pages

### 方式一：网页操作（推荐新手）

1. 在 GitHub 创建一个新仓库（比如 `quickpaste`）
2. 把本目录的所有文件 push 到 `main` 分支
3. 仓库 **Settings → Pages**
4. Source 选择 **GitHub Actions**
5. 等 1-2 分钟自动部署完成，访问 `https://<你的用户名>.github.io/quickpaste/`

### 方式二：Git 命令行

```bash
# 1. 初始化并提交
cd QuickPaste
git init
git add .
git commit -m "feat: initial quickpaste PWA"

# 2. 关联远程仓库（替换成你的）
git remote add origin https://github.com/<你的用户名>/quickpaste.git
git branch -M main
git push -u origin main

# 3. GitHub Actions 会自动构建并部署
```

### 启用 PWA 安装提示

部署后用 Chrome / Edge / Safari 打开页面，地址栏会出现「安装」图标，点击「安装」即可添加到桌面 / 主屏幕。

- **iOS Safari**：点击底部分享按钮 → 「添加到主屏幕」
- **Android Chrome**：地址栏右侧会出现「安装应用」按钮
- **长按桌面图标** → 快捷菜单可一键「创建快贴房间」

## 🎯 使用流程

### 创建设备（Host）

1. 打开页面 → 点击「**创建快贴房间**」
2. 页面显示 6 位房间号 + 二维码
3. 把二维码展示给其他设备扫码

### 其他设备（Guest）

**方式 A：扫码**
- 直接用相机扫描 Host 的二维码，自动打开并加入房间

**方式 B：手动输入**
- 打开同一页面 → 点击「**输入房间号加入**」→ 输入 6 位房间号

**方式 C：分享链接**
- Host 点击「复制分享链接」→ 把链接发给其他设备 → 直接打开

### 互传内容

- **文本**：输入框输入 → 回车 / 点「发送」
- **图片**（压缩 / 原图无损）：
  - 点击 🖼 选图 / **直接粘贴**（Ctrl+V） / **拖拽**到页面
  - 点击房间右上角 **画质按钮** 切换压缩（~500KB）或原图无损模式
- **视频**（压缩 / 原图无损）：点击 🎬 选视频文件，画质按钮同样生效
- 所有设备实时收到，毫秒级延迟

## 🔧 进阶配置

### 自建信令服务器（可选）

默认使用 `0.peerjs.com` 公共信令。如果你想用私有信令（比如避免公共服务器限速）：

1. 部署一个 [PeerJS Server](https://github.com/peers/peerjs-server)（Docker 一行起）
2. 打开页面，右上角「自定义信令服务器（可选）」折叠面板
3. 填入你的信令服务器地址和 API Key → 保存
4. 下次创建 / 加入房间时生效

### 自定义房间号规则

编辑 `app.js` 里的 `ROOM_ALPHABET` 常量即可（默认去掉了容易混淆的 `0/1/I/L/O`）。

### 替换图标

修改 `icons/generate.py` 里的颜色和图案，重新运行：

```bash
python icons/generate.py
```

或者直接替换 `icons/icon-192.png` / `icon-512.png` 为你自己的图片。

## 🧪 本地测试

PWA 一些特性（如 Service Worker）只在 HTTPS 或 `localhost` 下生效，本地测试需要起一个静态服务器：

```bash
# Python 3
python -m http.server 8080

# 或 Node.js
npx serve .
```

浏览器打开 `http://localhost:8080`。

要测试 P2P 互传：开两个浏览器窗口（或一个普通窗口 + 一个无痕窗口），一个创建房间，另一个用房间号加入。

## 📝 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
| --- | --- | --- |
| iOS Safari | 11.3+ | WebRTC + PWA 完整支持 |
| Android Chrome | 80+ | 全部功能 |
| macOS Chrome / Edge | 80+ | 全部功能 |
| Windows Chrome / Edge | 80+ | 全部功能 |
| Firefox | 78+ | 全部功能 |

## 📄 License

MIT
