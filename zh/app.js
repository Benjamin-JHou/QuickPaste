/* ============================================================
 * QuickPaste — EN
 * Cross-device temporary P2P clipboard via WebRTC + PeerJS
 * ============================================================ */
(function () {
  'use strict';

  // ====== DOM refs ======
  const $ = (id) => document.getElementById(id);
  const homeScreen = $('home');
  const roomScreen = $('room');
  const createBtn = $('createBtn');
  const joinBtn = $('joinBtn');
  const leaveBtn = $('leaveBtn');
  const copyUrlBtn = $('copyUrlBtn');
  const roomIdEl = $('roomId');
  const qrBox = $('qrBox');
  const peerCountEl = $('peerCount');
  const peerListEl = $('peerList');
  const messagesEl = $('messages');
  const textInput = $('textInput');
  const sendBtn = $('sendBtn');
  const imageBtn = $('imageBtn');
  const imageInput = $('imageInput');
  const toastEl = $('toast');
  const customPeerHost = $('customPeerHost');
  const customPeerKey = $('customPeerKey');
  const savePeerConfig = $('savePeerConfig');

  // ====== State ======
  const STATE = {
    peer: null,
    role: null,       // 'host' | 'guest'
    roomId: null,
    deviceId: null,
    peers: new Map(),
    roomPrefix: null,
    config: loadConfig(),
  };

  // ====== Helpers ======
  const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/1/I/L/O
  function genRoomId() {
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
    }
    return id;
  }
  const animals = ['狐', '熊', '鹰', '猫', '狼', '鹿', '兔', '鲸', '鲨', '猫头鹰'];
  function genDeviceId() {
    const a = animals[Math.floor(Math.random() * animals.length)];
    const n = Math.floor(Math.random() * 90 + 10);
    return `${a}${n}`;
  }
  function shortId(peerId) {
    return peerId.split('-').pop().slice(0, 6);
  }
  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem('qp:config') || '{}');
    } catch (_) {
      return {};
    }
  }
  function saveConfig(cfg) {
    Object.assign(STATE.config, cfg);
    localStorage.setItem('qp:config', JSON.stringify(STATE.config));
  }

  // ====== Toast ======
  let toastTimer = null;
  function toast(msg, ms = 2200) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // ====== Screen switching ======
  function showScreen(name) {
    homeScreen.classList.toggle('active', name === 'home');
    roomScreen.classList.toggle('active', name === 'room');
  }

  // ====== Message rendering ======
  function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'msg';

    if (msg.type === 'system') {
      div.classList.add('system');
      div.textContent = msg.text;
    } else if (msg.type === 'image') {
      div.classList.add('image-msg', msg.mine ? 'mine' : 'theirs');
      if (!msg.mine && msg.from) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = msg.from;
        div.appendChild(meta);
      }
      const img = document.createElement('img');
      img.src = msg.data;
      img.alt = '图片';
      img.loading = 'lazy';
      img.addEventListener('click', () => openImage(msg.data));
      div.appendChild(img);
    } else {
      div.classList.add(msg.mine ? 'mine' : 'theirs');
      if (!msg.mine && msg.from) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = msg.from;
        div.appendChild(meta);
      }
      div.appendChild(document.createTextNode(msg.text));
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openImage(src) {
    const w = window.open('');
    if (w) {
      w.document.write(
        `<title>图片预览</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="${src}">`,
      );
    } else {
      toast('无法打开预览，请允许弹窗');
    }
  }

  // ====== Peer list ======
  function refreshPeerList() {
    const arr = Array.from(STATE.peers.values());
    peerListEl.innerHTML = '';

    const me = document.createElement('span');
    me.className = 'peer-chip you';
    me.innerHTML = `<span class="dot"></span>${STATE.deviceId} (me)`;
    peerListEl.appendChild(me);

    for (const p of arr) {
      const chip = document.createElement('span');
      chip.className = 'peer-chip';
      chip.innerHTML = `<span class="dot"></span>${p.name}`;
      peerListEl.appendChild(chip);
    }

    peerCountEl.textContent = arr.length;
  }

  // ====== QR code ======
  function renderQR(roomId) {
    const shareUrl = `${location.origin}${location.pathname}#room=${roomId}`;
    qrBox.innerHTML = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(shareUrl);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
    } catch (e) {
      qrBox.textContent = shareUrl;
    }
  }

  // ====== PeerJS ======
  function destroyPeer() {
    if (STATE.peer) { try { STATE.peer.destroy(); } catch (_) {} STATE.peer = null; }
    STATE.peers.forEach((p) => { try { p.conn.close(); } catch (_) {} });
    STATE.peers.clear();
  }

  function buildPeerOptions(extra = {}) {
    const opts = { debug: 1 };
    if (STATE.config.host) opts.host = STATE.config.host;
    if (STATE.config.port) opts.port = Number(STATE.config.port);
    if (STATE.config.path) opts.path = STATE.config.path;
    if (STATE.config.key) opts.key = STATE.config.key;
    Object.assign(opts, extra);
    return opts;
  }

  function enterRoom(role, roomId) {
    STATE.role = role;
    STATE.roomId = roomId;
    STATE.roomPrefix = `qp-${roomId}`;
    roomIdEl.textContent = roomId;
    renderQR(roomId);
    showScreen('room');
    messagesEl.innerHTML = '';
    appendMessage({ type: 'system', text: '正在连接信令服务器…' });

    const myId =
      role === 'host'
        ? `${STATE.roomPrefix}-master`
        : `${STATE.roomPrefix}-guest-${Math.random().toString(36).slice(2, 8)}`;

    const peer = new Peer(myId, buildPeerOptions());
    STATE.peer = peer;

    peer.on('open', (id) => {
      console.log('[peer] open', id);
      if (role === 'host') {
        appendMessage({ type: 'system', text: '房间已创建，等待其他设备加入…' });
      }
      if (role === 'guest') {
        connectTo(`${STATE.roomPrefix}-master`);
      }
    });

    peer.on('connection', (conn) => {
      console.log('[peer] incoming connection', conn.peer);
      setupConnection(conn, { initiator: false });
    });

    peer.on('error', (err) => {
      console.error('[peer] error', err);
      let msg = '连接出错';
      switch (err.type) {
        case 'unavailable-id':   msg = '房间号已被占用，请换一个'; break;
        case 'network':         msg = '网络异常，请检查连接'; break;
        case 'server-error':    msg = '信令服务器错误'; break;
        case 'peer-unavailable':msg = '找不到目标设备，请确认房间号正确'; break;
        case 'ssl-unavailable': msg = 'SSL 不可用'; break;
      }
      toast(msg);
      appendMessage({ type: 'system', text: `⚠️ ${msg}` });
    });

    peer.on('disconnected', () => {
      toast('与信令服务器断开，正在重连…');
      try { peer.reconnect(); } catch (_) {}
    });
  }

  function connectTo(remoteId) {
    if (!STATE.peer || STATE.peers.has(remoteId)) return;
    console.log('[peer] connecting to', remoteId);
    const conn = STATE.peer.connect(remoteId, { reliable: true, serialization: 'json' });
    setupConnection(conn, { initiator: true });
  }

  function setupConnection(conn, opts) {
    conn.on('open', () => {
      console.log('[conn] open', conn.peer);
      if (STATE.role === 'host' && opts.initiator) {
        const peerList = Array.from(STATE.peers.keys());
        conn.send({ kind: 'sync', you: STATE.deviceId, existing: peerList });
        broadcastExcept(conn.peer, { kind: 'join', id: conn.peer });
      }
      if (STATE.role === 'guest' && opts.initiator) {
        conn.send({ kind: 'hello', you: STATE.deviceId });
      }
    });

    conn.on('data', (data) => { handleData(conn.peer, data); });

    conn.on('close', () => {
      console.log('[conn] close', conn.peer);
      const p = STATE.peers.get(conn.peer);
      if (p) {
        appendMessage({ type: 'system', text: `${p.name} left the room` });
        STATE.peers.delete(conn.peer);
        refreshPeerList();
      }
      broadcastExcept(conn.peer, { kind: 'leave', id: conn.peer });
    });

    conn.on('error', (err) => { console.error('[conn] error', err); });

    STATE.peers.set(conn.peer, { conn, name: shortId(conn.peer), isMine: false });
    refreshPeerList();
  }

  function handleData(peerId, data) {
    if (!data || typeof data !== 'object') return;

    if (data.kind === 'hello' || data.kind === 'sync') {
      const p = STATE.peers.get(peerId);
      if (p) { p.name = data.you || p.name; refreshPeerList(); }
      appendMessage({ type: 'system', text: `${p ? p.name : shortId(peerId)} connected` });
      if (data.kind === 'sync' && Array.isArray(data.existing)) {
        for (const id of data.existing) {
          if (!STATE.peers.has(id)) connectTo(id);
        }
      }
      return;
    }

    if (data.kind === 'join') {
      if (!STATE.peers.has(data.id) && data.id !== STATE.peer.id) connectTo(data.id);
      return;
    }

    if (data.kind === 'leave') {
      const p = STATE.peers.get(data.id);
      if (p) {
        appendMessage({ type: 'system', text: `${p.name} left the room` });
        try { p.conn.close(); } catch (_) {}
        STATE.peers.delete(data.id);
        refreshPeerList();
      }
      return;
    }

    if (data.kind === 'msg') {
      const p = STATE.peers.get(peerId);
      appendMessage({
        type: data.msgType,
        mine: false,
        from: p ? p.name : shortId(peerId),
        text: data.text,
        data: data.data,
      });
    }
  }

  function broadcastExcept(excludeId, payload) {
    STATE.peers.forEach((p, id) => {
      if (id === excludeId) return;
      try { if (p.conn.open) p.conn.send(payload); } catch (_) {}
    });
  }

  function broadcast(payload) {
    STATE.peers.forEach((p) => {
      try { if (p.conn.open) p.conn.send(payload); } catch (_) {}
    });
  }

  // ====== Sending ======
  function sendText() {
    const text = textInput.value.trim();
    if (!text) return;
    textInput.value = '';
    appendMessage({ type: 'text', mine: true, text });
    broadcast({ kind: 'msg', msgType: 'text', text });
  }

  async function sendImages(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const n = list.length;
    toast(`正在处理 ${n} 张图片…`);
    for (const file of list) {
      try {
        const dataUrl = await compressImage(file, 1200, 0.8);
        appendMessage({ type: 'image', mine: true, data: dataUrl });
        broadcast({ kind: 'msg', msgType: 'image', data: dataUrl });
      } catch (e) {
        console.error(e);
        toast('图片处理失败：' + (e.message || e));
      }
    }
  }

  function compressImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('读取失败'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('图片格式不支持'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
            else { width = Math.round((width * maxSize) / height); height = maxSize; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try { resolve(canvas.toDataURL('image/jpeg', quality)); }
          catch (e) { reject(e); }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ====== Leave room ======
  function leaveRoom() {
    destroyPeer();
    STATE.role = null; STATE.roomId = null; STATE.roomPrefix = null;
    showScreen('home');
    if (location.hash) history.replaceState(null, '', location.pathname);
  }

  // ====== URL hash (scan to join) ======
  function parseHashRoom() {
    const m = location.hash.match(/room=([A-Z0-9]+)/i);
    return m ? m[1].toUpperCase() : null;
  }
  function joinFromHash() {
    const id = parseHashRoom();
    if (!id) return;
    STATE.deviceId = genDeviceId();
    enterRoom('guest', id);
  }

  // ====== Event binding ======
  createBtn.addEventListener('click', () => {
    STATE.deviceId = genDeviceId();
    enterRoom('host', genRoomId());
  });

  joinBtn.addEventListener('click', () => {
    const id = prompt('请输入 6 位房间号：');
    if (!id) return;
    const clean = id.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(clean)) { toast('房间号格式不对'); return; }
    STATE.deviceId = genDeviceId();
    enterRoom('guest', clean);
  });

  leaveBtn.addEventListener('click', () => {
    if (confirm('离开当前房间？\n所有连接将断开。')) leaveRoom();
  });

  copyUrlBtn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#room=${STATE.roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('链接已复制，分享给其他设备即可');
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('链接已复制'); }
      catch (e) { toast('复制失败，请手动复制：' + url); }
      document.body.removeChild(ta);
    }
  });

  sendBtn.addEventListener('click', sendText);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  });

  imageBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) { sendImages(e.target.files); }
    e.target.value = '';
  });

  document.addEventListener('paste', (e) => {
    if (roomScreen.classList.contains('active') && e.clipboardData) {
      const imgs = Array.from(e.clipboardData.items || [])
        .filter((it) => it.type && it.type.startsWith('image/'))
        .map((it) => it.getAsFile()).filter(Boolean);
      if (imgs.length) { e.preventDefault(); sendImages(imgs); }
    }
  });

  roomScreen.addEventListener('dragover', (e) => { if (roomScreen.classList.contains('active')) e.preventDefault(); });
  roomScreen.addEventListener('drop', (e) => {
    if (roomScreen.classList.contains('active') && e.dataTransfer && e.dataTransfer.files) {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length) sendImages(files);
    }
  });

  if (STATE.config.host) customPeerHost.value = STATE.config.host;
  if (STATE.config.key) customPeerKey.value = STATE.config.key;
  savePeerConfig.addEventListener('click', () => {
    const v = customPeerHost.value.trim();
    const k = customPeerKey.value.trim();
    saveConfig({ host: v || undefined, key: k || undefined });
    toast('已保存（下次创建房间生效）');
  });

  // ── Theme switcher ──
  const themeBtn = $('themeBtn');
  const themeIconBlue  = $('themeIconBlue');
  const themeIconPink  = $('themeIconPink');
  const THEME_KEY = 'qp:theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'pink') {
      themeIconBlue.style.display  = 'none';
      themeIconPink.style.display = 'block';
    } else {
      themeIconBlue.style.display  = 'block';
      themeIconPink.style.display = 'none';
    }
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) applyTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'pink' ? '' : 'pink');
    });
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW 注册失败', e));
    });
  }

  window.addEventListener('hashchange', () => {
    if (parseHashRoom() && !STATE.peer) joinFromHash();
  });
  if (parseHashRoom()) { STATE.deviceId = genDeviceId(); joinFromHash(); }
})();