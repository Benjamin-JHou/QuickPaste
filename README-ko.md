[English](README.md) · [中文](README-en.md) · **한국어**

---

# QuickPaste · 기기 간 즉시 전송

> 스캔하여 사용 · 기기 간 텍스트, 이미지, 비디오 임시 전송 · WebRTC P2P 직접 연결 · 로그인 불필요 · GitHub Pages 배포.

## ✨ 주요 기능

- 🚀 **계정 불필요** — 페이지를 열고 방 번호 입력 또는 QR 스캔하여 즉시 시작
- 🌐 **진정한 크로스 플랫폼** — iOS / Android / Windows / macOS / Linux 브라우저 모두 상호 호환
- 📷 **텍스트 + 이미지 + 비디오** — 즉각 전송; 손실 없는 원본 화질 모드 지원
- ⚡ **P2P 직접 전송** — WebRTC DataChannel, 어떤 서버도 거치지 않음
- 🪶 **다운로드 불필요** — PWA 홈 화면 설치, 네이티브 앱처럼 실행
- 🔒 **프라이버시 우선** — 방을 닫으면 모든 것이 사라짐; 백엔드 로그 없음
- 🌐 **크로스 플랫폼 전송** — 브라우저만 있으면 어디서든 — iOS, Android, Windows, macOS, Linux. 앱 다운로드 불필요
- 🔐 **프라이버시 전송** — 종단 간 암호화. 로그 불록, 서버 저장 없음. 전송 내용은 내 기기 사이에만 존재
- 🕐 **임시 전송** — 데이터는 세션 동안만 존재. 방을 닫으면 모든 내용이 자동으로 사라지며, 어디에도 저장되지 않음
- 🖼 **원본 화질 이미지** — 압축 없이 원본 그대로 전송하는 모드 전환 가능
- 🎬 **비디오 전송** — 비디오 파일 전송 지원; 압축 또는 원본 화질 중 선택

## 🌏 다국어 지원

**English**(기본), **中文**, **한국어** 세 가지 언어 지원 — 페이지 상단 언어 바에서 언제든 전환 가능.

| URL | 언어 |
|-----|------|
| `/` | English (기본) |
| `/zh/` | 中文 |
| `/ko/` | 한국어 |
| [`README.md`](README.md) · [`README-en.md`](README-en.md) · [`README-ko.md`](README-ko.md) | 세 가지 언어 문서 |

## 🧬 기술 스택

| 역할 | 솔루션 |
| --- | --- |
| 프론트엔드 | 순수 HTML + CSS + 바닐라 JS (빌드 단계 없음) |
| P2P 전송 | WebRTC DataChannel |
| 바이너리 청크 전송 | 64 KB 청크, 무손실 이미지 / 비디오 |
| 시그널링 | PeerJS Cloud (공개 0.peerjs.com) |
| QR 코드 | qrcode-generator |
| 배포 | GitHub Pages + GitHub Actions |
| PWA | 언어별 독립 manifest + Service Worker (오프라인 캐시) |

## 📁 프로젝트 구조

```
QuickPaste/
├── index.html              # 메인 진입점 (manifest / SW 등록)
├── app.js                  # 핵심 로직 (WebRTC + 방 관리 + 바이너리 전송)
├── style.css               # 스타일 (모바일 우선 + 다크 UI, 두 가지 테마)
├── manifest.json           # EN PWA 매니페스트
├── sw.js                   # Service Worker (오프라인 캐시)
├── icons/                  # PWA 아이콘 (192/512/maskable/apple/favicon)
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages 자동 배포
├── .nojekyll               # Jekyll 비활성화 (정적 파일 직접 제공)
├── README.md               # 본 파일 — English (기본)
├── README-en.md            # 中文 문서
├── README-ko.md            # 한국어 문서
├── zh/                     # 中文 버전 (index.html, app.js, manifest, sw, icons, tutorial)
└── ko/                     # 한국어 버전 (index.html, app.js, manifest, sw, icons, tutorial)
```

## 🚀 GitHub Pages 배포

### 방법 1: 웹 UI (초보자 추천)

1. GitHub에서 새 저장소 생성 (예: `quickpaste`)
2. 본 디렉토리의 모든 파일을 `main` 브랜치에 push
3. 저장소 **Settings → Pages** 이동
4. Source: **GitHub Actions** 선택
5. 1-2분 자동 배포 후 `https://<당신의 사용자명>.github.io/quickpaste/` 접속

### 방법 2: Git CLI

```bash
# 1. 초기화 및 커밋
cd QuickPaste
git init
git add .
git commit -m "feat: initial quickpaste PWA"

# 2. 원격 저장소 연결 (당신의 것으로 교체)
git remote add origin https://github.com/<당신의-사용자명>/quickpaste.git
git branch -M main
git push -u origin main

# 3. GitHub Actions가 자동 빌드 및 배포
```

### PWA 설치 프롬프트 활성화

배포 후 Chrome / Edge / Safari에서 페이지 열기 — 주소 표시줄에 "설치" 아이콘 표시. 클릭하여 홈 화면 / 데스크톱에 추가.

- **iOS Safari**: 하단 공유 버튼 탭 → "홈 화면에 추가"
- **Android Chrome**: 주소 표시줄 오른쪽에 "앱 설치" 버튼 표시
- **앱 아이콘 길게 누르기** → "QuickPaste 방 만들기" 바로 가기

## 🎯 사용 방법

### 방 만들기 (호스트)

1. 페이지 열기 → **"방 만들기"** 탭
2. 6자리 방 번호 + QR 코드 표시
3. 다른 기기에 QR 코드 보여주기

### 다른 기기에서 참여 (게스트)

**방법 A: QR 스캔**
- 기기 카메라로 호스트의 QR 스캔 — 자동으로 페이지가 열리며 방 참여

**방법 B: 수동 입력**
- 같은 페이지 열기 → **"방 번호 스캔 또는 입력"** 탭 → 6자리 방 번호 입력

**방법 C: 링크 공유**
- 호스트 "공유 링크 복사" 탭 → 다른 기기로 전송 → 링크 직접 열기

### 콘텐츠 전송

- **텍스트**: 입력 필드에 입력 → Enter 누르거나 전송 탭
- **이미지** (압축 / 무손실):
  - 🖼 탭하여 선택 / **직접 붙여넣기** (Ctrl+V) / **드래그 앤 드롭**
  - 방 오른쪽 상단의 **화질 버튼**으로 압축(~500KB)과 원본 무손실 모드 전환
- **비디오** (압축 / 무손실): 🎬 탭하여 비디오 파일 전송 — 같은 화질 토글 적용
- 모든 연결된 기기에 밀리초 단위 지연으로 실시간 전송

## 🔧 고급 설정

### 사용자 정의 시그널링 서버 (선택)

기본적으로 QuickPaste는 공개 `0.peerjs.com` 시그널링 서버 사용. 개인 시그널링 서버를 사용하려면 (예: 공개 서버 속도 제한 회피):

1. [PeerJS Server](https://github.com/peers/peerjs-server) 배포 (Docker 한 줄로 시작)
2. 페이지 열고 "사용자 정의 시그널링 서버 (선택)" 패널 확장 (우측 상단)
3. 시그널링 서버 주소와 API Key 입력 → 저장
4. 다음 방 생성 / 참여 시 적용

### 방 번호 규칙 사용자 정의

`app.js`의 `ROOM_ALPHABET` 상수를 편집하여 허용 문자 사용자 정의 (기본값은 혼동하기 쉬운 `0/1/I/L/O` 제거).

### 아이콘 교체

`icons/generate.py`의 색상과 패턴을 수정한 후 실행:

```bash
python icons/generate.py
```

또는 `icons/icon-192.png` / `icon-512.png`를 직접 본인 이미지로 교체.

## 🧪 로컬 테스트

일부 PWA 기능(Service Worker 등)은 HTTPS 또는 `localhost`에서만 작동. 로컬 테스트:

```bash
# Python 3
python -m http.server 8080

# 또는 Node.js
npx serve .
```

브라우저에서 `http://localhost:8080` 열기.

P2P 전송 테스트: 두 개의 브라우저 창 열기 (또는 일반 + 시크릿 창 하나씩), 하나는 방 생성, 다른 하나는 방 번호로 참여.

## 📝 브라우저 호환성

| 브라우저 | 최소 버전 | 비고 |
| --- | --- | --- |
| iOS Safari | 11.3+ | WebRTC + PWA 완전 지원 |
| Android Chrome | 80+ | 모든 기능 |
| macOS Chrome / Edge | 80+ | 모든 기능 |
| Windows Chrome / Edge | 80+ | 모든 기능 |
| Firefox | 78+ | 모든 기능 |

## 📄 라이선스

MIT
