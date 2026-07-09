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
  const qualityBtn = $('qualityBtn');
  const videoBtn = $('videoBtn');
  const videoInput = $('videoInput');

  // ====== State ======
  const STATE = {
    peer: null,
    role: null,       // 'host' | 'guest'
    roomId: null,
    deviceId: null,
    peers: new Map(),
    roomPrefix: null,
    config: loadConfig(),
    lossless: false,
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
  const animals = ['여우', '곰', '독수리', '고양이', '늑대', '사슴', '토끼', '고래', '상어', '부엉이'];
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
    } else if (msg.type === 'image' || msg.type === 'video') {
      div.classList.add('image-msg', msg.mine ? 'mine' : 'theirs');
      if (!msg.mine && msg.from) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = msg.from;
        div.appendChild(meta);
      }
      if (msg.type === 'video') {
        const video = document.createElement('video');
        video.src = msg.data;
        video.controls = true;
        video.preload = 'metadata';
        video.style.maxWidth = '100%';
        video.style.borderRadius = '8px';
        video.style.display = 'block';
        div.appendChild(video);
        const img = document.createElement('img');
        img.src = msg.data;
        img.alt = '이미지';
        img.loading = 'lazy';
        img.addEventListener('click', () => openImage(msg.data));
        div.appendChild(img);
      }
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
        `<title>이미지 미리보기</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="${src}">`,
      );
    } else {
      toast('미리보기를 열 수 없습니다. 팝업을 허용하세요.');
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
    appendMessage({ type: 'system', text: '시그널링 서버에 연결 중…' });

    const myId =
      role === 'host'
        ? `${STATE.roomPrefix}-master`
        : `${STATE.roomPrefix}-guest-${Math.random().toString(36).slice(2, 8)}`;

    const peer = new Peer(myId, buildPeerOptions());
    STATE.peer = peer;

    peer.on('open', (id) => {
      console.log('[peer] open', id);
      if (role === 'host') {
        appendMessage({ type: 'system', text: '방이 생성되었습니다. 다른 기기 접속 대기 중…' });
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
      let msg = '연결 오류';
      switch (err.type) {
        case 'unavailable-id':   msg = '방 번호가 이미 사용 중입니다. 다른 번호를 입력하세요.'; break;
        case 'network':         msg = '네트워크 오류. 연결을 확인하세요.'; break;
        case 'server-error':    msg = '시그널링 서버 오류'; break;
        case 'peer-unavailable':msg = '대상 기기를 찾을 수 없습니다. 방 번호를 확인하세요.'; break;
        case 'ssl-unavailable': msg = 'SSL 사용 불가'; break;
      }
      toast(msg);
      appendMessage({ type: 'system', text: `⚠️ ${msg}` });
    });

    peer.on('disconnected', () => {
      toast('시그널링 서버와 연결이 끊어졌습니다. 재연결 중…');
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

    if (data.kind === 'bin-chunk') {
      if (!_binChunks.has(data.id)) _binChunks.set(data.id, []);
      _binChunks.get(data.id)[data.idx] = new Uint8Array(data.data);
    }

    if (data.kind === 'bin-done') {
      const chunks = _binChunks.get(data.id);
      if (chunks) {
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const buf = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) { buf.set(c, off); off += c.length; }
        _binChunks.delete(data.id);
        const blob = new Blob([buf], { type: data.mime || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const isVideo = (data.mime || '').startsWith('video/');
        const p = STATE.peers.get(peerId);
        appendMessage({
          type: isVideo ? 'video' : 'image',
          mine: false,
          from: p ? p.name : shortId(peerId),
          data: url,
        });
      }
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
    toast(`${n}개 이미지 처리 중…`);
    for (const file of list) {
      try {
        if (STATE.lossless) {
          const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          appendMessage({ type: 'image', mine: true, data: URL.createObjectURL(file) });
          await sendBinaryChunks(file, id, file.type);
        } else {
          const dataUrl = await compressImage(file, 1200, 0.8);
          appendMessage({ type: 'image', mine: true, data: dataUrl });
          broadcast({ kind: 'msg', msgType: 'image', data: dataUrl });
        }
      } catch (e) {
        console.error(e);
        toast('이미지 처리 실패: ' + (e.message || e));
      }
    }
  }

  // ====== Binary (lossless) transfer ======
  const CHUNK_SIZE = 64 * 1024;
  const _binChunks = new Map();

  function sendBinaryChunks(file, id, mime) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.onload = (e) => {
        const buf = e.target.result;
        const total = buf.byteLength;
        const totalChunks = Math.ceil(total / CHUNK_SIZE);
        let idx = 0;
        const sendNext = () => {
          if (idx >= totalChunks) {
            broadcast({ kind: 'bin-done', id, mime });
            resolve();
            return;
          }
          const slice = buf.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
          broadcast({ kind: 'bin-chunk', id, idx, total: totalChunks, mime, data: slice });
          idx++;
          setTimeout(sendNext, 0);
        };
        sendNext();
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async function sendVideos(files) {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('video/'));
    if (!list.length) { toast('비디오 파일을 찾을 수 없습니다'); return; }
    const n = list.length;
    toast(`${n}개 비디오 전송 중…`);
    for (const file of list) {
      try {
        const id = `vid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        appendMessage({ type: 'video', mine: true, data: URL.createObjectURL(file) });
        await sendBinaryChunks(file, id, file.type);
      } catch (e) {
        console.error(e);
        toast('비디오 전송 실패: ' + (e.message || e));
      }
    }
  }

  function compressImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('지원되지 않는 이미지 형식입니다'));
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
    const id = prompt('6자리 방 번호를 입력하세요:');
    if (!id) return;
    const clean = id.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(clean)) { toast('방 번호 형식이 올바르지 않습니다'); return; }
    STATE.deviceId = genDeviceId();
    enterRoom('guest', clean);
  });

  leaveBtn.addEventListener('click', () => {
    if (confirm('현재 방을 나가시겠습니까?\n모든 연결이 끊어집니다.')) leaveRoom();
  });

  copyUrlBtn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#room=${STATE.roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('링크가 복사되었습니다. 공유하면 됩니다');
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('복사됨'); }
      catch (e) { toast('복사 실패. URL: ' + url); }
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

  videoBtn.addEventListener('click', () => videoInput.click());
  videoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) { sendVideos(e.target.files); }
    e.target.value = '';
  });

  function updateQualityUI() {
    const el = $('qualityBtn');
    const iconLossy  = $('qlIconLossy');
    const iconLossless = $('qlIconLossless');
    if (!el) return;
    if (STATE.lossless) {
      el.classList.add('active');
      if (iconLossy) iconLossy.style.display = 'none';
      if (iconLossless) iconLossless.style.display = 'inline';
    } else {
      el.classList.remove('active');
      if (iconLossy) iconLossy.style.display = 'inline';
      if (iconLossless) iconLossless.style.display = 'none';
    }
  }

  qualityBtn.addEventListener('click', () => {
    STATE.lossless = !STATE.lossless;
    saveConfig({ lossless: STATE.lossless });
    updateQualityUI();
  });

  if (STATE.config.lossless) {
    STATE.lossless = true;
    updateQualityUI();
  }

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
    toast('저장됨 (다음 방부터 적용)');
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
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('서비스 워커 등록 실패', e));
    });
  }

  window.addEventListener('hashchange', () => {
    if (parseHashRoom() && !STATE.peer) joinFromHash();
  });
  if (parseHashRoom()) { STATE.deviceId = genDeviceId(); joinFromHash(); }
})();