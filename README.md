**English** · [中文](README-en.md) · [한국어](README-ko.md)

---

# QuickPaste · Cross-Device Instant Transfer

> Scan to use · Instant text, image & video transfer across devices · P2P direct via WebRTC · No login · Deployed on GitHub Pages.

## ✨ Features

- 🚀 **Zero account** — Open the page, enter room ID or scan QR code to start
- 🌐 **True cross-platform** — iOS / Android / Windows / macOS / Linux browsers all work together
- 📷 **Text, images & video** — Instant delivery; lossless original-quality mode available
- ⚡ **P2P direct transfer** — WebRTC DataChannel, content never touches any server
- 🪶 **No download** — PWA installable to home screen, runs like a native app
- 🔒 **Privacy first** — Room closes, everything clears; no backend logs
- 🌐 **Cross-Platform Transfer** — Any device with a browser works; iOS, Android, Windows, macOS, Linux, no app required
- 🔐 **Privacy Transfer** — End-to-end encrypted, no logs, no server storage. Your content stays between your devices
- 🕐 **Temporary Transfer** — Data exists only during the session. Close the room and everything is gone — nothing persisted anywhere
- 🖼 **Lossless image transfer** — Toggle to send original-quality images, no compression
- 🎬 **Video transfer** — Send video files; choose between compressed or lossless original quality

## 🌏 Languages

Supports **English** (default), **中文**, **한국어** — switch anytime via the top language bar.

| URL | Language |
|-----|----------|
| `/` | English (default) |
| `/zh/` | 中文 |
| `/ko/` | 한국어 |
| [`README.md`](README.md) · [`README-en.md`](README-en.md) · [`README-ko.md`](README-ko.md) | Docs in all three languages |

## 🧬 Tech Stack

| Role | Solution |
| --- | --- |
| Frontend | Pure HTML + CSS + vanilla JS (no build step) |
| P2P Transfer | WebRTC DataChannel |
| Binary chunked transfer | 64 KB chunks for lossless images & video |
| Signaling | PeerJS Cloud (public 0.peerjs.com) |
| QR Code | qrcode-generator |
| Deployment | GitHub Pages + GitHub Actions |
| PWA | manifest (per language) + Service Worker (offline cache) |

## 📁 Project Structure

```
QuickPaste/
├── index.html              # Main entry (manifest / SW registration)
├── app.js                  # Core logic (WebRTC + room management + binary transfer)
├── style.css               # Styles (mobile-first + dark UI, two themes)
├── manifest.json           # EN PWA manifest
├── sw.js                   # Service Worker (offline cache)
├── icons/                  # PWA icons (192/512/maskable/apple/favicon)
├── .github/workflows/
│   └── deploy.yml          # Auto-deploy to GitHub Pages
├── .nojekyll               # Disable Jekyll (serve static files directly)
├── README.md               # This file — English (default)
├── README-en.md            # 中文文档
├── README-ko.md            # 한국어 문서
├── zh/                     # Chinese version (index.html, app.js, manifest, sw, icons, tutorial)
└── ko/                     # Korean version (index.html, app.js, manifest, sw, icons, tutorial)
```

## 🚀 Deploy to GitHub Pages

### Option 1: Web UI (recommended for beginners)

1. Create a new repository on GitHub (e.g., `quickpaste`)
2. Push all files from this directory to the `main` branch
3. Go to repository **Settings → Pages**
4. Source: select **GitHub Actions**
5. Wait 1–2 minutes for auto-deployment, then visit `https://<your-username>.github.io/quickpaste/`

### Option 2: Git CLI

```bash
# 1. Initialize and commit
cd QuickPaste
git init
git add .
git commit -m "feat: initial quickpaste PWA"

# 2. Link remote repository (replace with your own)
git remote add origin https://github.com/<your-username>/quickpaste.git
git branch -M main
git push -u origin main

# 3. GitHub Actions will build and deploy automatically
```

### Enable PWA install prompt

After deployment, open the page in Chrome / Edge / Safari — the address bar will show an "Install" icon. Click it to add to home screen / desktop.

- **iOS Safari**: Tap the share button at the bottom → "Add to Home Screen"
- **Android Chrome**: "Install app" button appears on the right of the address bar
- **Long-press the app icon** → Quick shortcut to `Create a QuickPaste room`

## 🎯 How to Use

### Create a room (Host)

1. Open the page → tap **"Create a room"**
2. The page shows a 6-character room ID + QR code
3. Display the QR code for other devices to scan

### Join from another device (Guest)

**Method A: Scan QR code**
- Use the device camera to scan the Host's QR code — it opens the page and joins automatically

**Method B: Manual entry**
- Open the same page → tap **"Scan or enter room ID"** → type the 6-character room ID

**Method C: Share link**
- Host taps "Copy share link" → send to other devices → they open the link directly

### Transfer content

- **Text**: Type in the input field → press Enter or tap Send
- **Images** (compressed / lossless): Tap the image button / **paste directly** (Ctrl+V) / **drag & drop** onto the page
  - Click the **quality button** (top-right in room) to toggle between compressed (~500KB) and original-quality lossless mode
- **Video** (compressed / lossless): Tap the video button to send video files — same quality toggle applies
- All connected devices receive content instantly with millisecond-level latency

## 🔧 Advanced Configuration

### Custom signaling server (optional)

By default QuickPaste uses the public `0.peerjs.com` signaling server. To use a private signaling server (e.g., to avoid public server rate limits):

1. Deploy a [PeerJS Server](https://github.com/peers/peerjs-server) (one Docker command to start)
2. Open the page, expand the "Custom signaling server (optional)" panel (top right)
3. Enter your signaling server address and API Key → Save
4. Takes effect next time you create or join a room

### Custom room ID rules

Edit the `ROOM_ALPHABET` constant in `app.js` to customize allowed characters (default removes easily confused `0/1/I/L/O`).

### Replace icons

Edit colors and patterns in `icons/generate.py`, then run:

```bash
python icons/generate.py
```

Or replace `icons/icon-192.png` / `icon-512.png` directly with your own images.

## 🧪 Local Testing

Some PWA features (like Service Worker) only work under HTTPS or `localhost`. To test locally:

```bash
# Python 3
python -m http.server 8080

# or Node.js
npx serve .
```

Then open `http://localhost:8080` in your browser.

To test P2P transfer: open two browser windows (or one regular + one incognito), one creates a room, the other joins with the room ID.

## 📝 Browser Compatibility

| Browser | Min Version | Notes |
| --- | --- | --- |
| iOS Safari | 11.3+ | Full WebRTC + PWA support |
| Android Chrome | 80+ | All features |
| macOS Chrome / Edge | 80+ | All features |
| Windows Chrome / Edge | 80+ | All features |
| Firefox | 78+ | All features |

## 📄 License

MIT
