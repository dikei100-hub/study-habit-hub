# 작업지시서 — PWA 설치 대응 및 설정 시트 신설

| | |
|---|---|
| 문서 ID | `2026-08-22-pwa-install` |
| 목표 | 아이폰 홈 화면에 추가해서 쓸 수 있는 상태로 만든다 |
| 산출물 기록 | `docs/sessions/2026-08-22.md` 에 이어 붙일 것 (같은 날) |
| 선행 | `2026-08-22-docs-consolidation` 완료 (`589fab2` 까지 push됨) |

---

## 0. 이 문서를 읽는 방법

- 이 문서가 이번 사이클의 **유일한 지시 원본**이다.
- **이 문서 자체는 수정하지 말 것.** 이견이 있으면 고치지 말고 먼저 보고한다.
- 결과는 `docs/sessions/2026-08-22.md` 에 **이어 붙인다.** 같은 날 두 번째 사이클이다.
- 이 지시서 파일은 커밋 1에 포함한다.
- **모든 보고는 화면에 출력하는 동시에 세션 문서에도 이어 붙인다. 둘의 내용은 같아야 한다.**

---

## 1. 상시 규칙

- 스택 버전 변경 금지. **라이브러리 추가 금지** (PWA 플러그인 등을 넣지 말 것).
- 빌드/배포 금지, push 금지 (사용자가 확인 후 직접 한다).
- `prettier --write` 를 저장소 전체에 돌리지 말 것 (autocrlf).
- `src/routeTree.gen.ts` 는 내용 차이 0인 채로 남아 있다. 스테이징하지 말 것.
- 히스토리 재작성 금지 (force push, rebase, amend, squash).
- **고치기 전에 계획을 먼저 보고하고 사용자의 확인을 받는다.**

---

## 2. 착수 전 확인

```
git log --oneline origin/main..HEAD
git status --short
```

- 로컬이 원격보다 앞서 있으면 그 커밋이 무엇인지 보고하고 멈춘다.
- `public/` 아래에 아이콘 PNG 4개가 미추적으로 있어야 한다. 없으면 보고하고 멈춘다.
- `public/drawable/`, `public/drawable-nodpi/`, `public/drawable.zip` 은 사용자가
  따로 정리한다. **이번 사이클에서 건드리지 말 것.** 커밋에도 넣지 않는다.

---

## 3. 고정 문자열

화면에 나가는 한글. 아래 그대로 쓸 것.

| 위치 | 문구 |
|---|---|
| 설정 시트 제목 | `설정` |
| 닫기 버튼 aria-label | `닫기` |
| 데이터 항목 제목 | `데이터 초기화` |
| 데이터 항목 설명 | `할 일과 기록을 모두 지우고 처음 상태로 되돌려요.` |
| 초기화 버튼 | `초기화` |
| 확인 단계 문구 | `정말 지울까요? 되돌릴 수 없어요.` |
| 확인 단계 버튼 | `네, 지울게요` / `취소` |
| 매니페스트 `name` | `공부체크 StudyMate` |
| 매니페스트 `short_name` | `공부체크` |
| 매니페스트 `description` | `고등학생을 위한 공부 습관 체크 웹앱.` |

---

## 4. 배경

1차 목표가 "아이폰 홈 화면에 추가할 수 있는 상태"인데 아직 매니페스트도 아이콘도 없다.

동시에 **설정 화면이 없다.** `Screen.tsx` 의 톱니 버튼은 `onClick` 이 없는 껍데기라
눌러도 아무 일이 없다. 홈 화면 웹앱은 DevTools 콘솔을 쓸 수 없어서, 화면 안에
데이터 초기화 수단이 없으면 실기기에서 데이터가 꼬였을 때 손쓸 방법이 앱 삭제뿐이다.
**아이콘보다 이쪽이 더 급하다.**

`CrossTrack_AppSpec.md` 7장은 "설정 화면을 웹판에서 다시 넣지 말 것"이라 하지만,
`CoreRules` 7장이 이미 "설정은 각 화면 톱니로 진입"으로 정했고 그 차이는
`CrossTrack_AppSpec.md` 헤더에 명시돼 있다. **CoreRules 를 따른다.**

---

## 5. 먼저 할 것 — 현재 구조 확인

- `src/routes/__root.tsx` 의 `head()` — `meta` / `links` 배열
- `src/components/app/Screen.tsx` — 톱니 버튼, `Card`, `MascotSlot`
- `src/components/app/ListSheet.tsx` — **바텀시트 구현 방식의 기준.**
  설정 시트는 이것과 같은 방식·같은 톤으로 만든다. 새 패턴을 발명하지 말 것.
- `src/lib/storage.ts` — `STORAGE_KEY`, `saveState`, `loadState`
- `src/state/StudyStore.tsx` — provider 가 상태를 어떻게 초기화하는지
- `docs/CoreRules.md` 7장(화면 구성)·9장(데이터 저장)·12장

---

## 6. 구현

### 커밋 1 — 설정: PWA 매니페스트와 아이콘 연결

허용 파일: `public/manifest.webmanifest`(신규), `public/*.png`(이미 있는 4개),
`src/routes/__root.tsx`, 이 지시서 파일

#### `public/manifest.webmanifest` 신규 생성

```json
{
  "name": "공부체크 StudyMate",
  "short_name": "공부체크",
  "description": "고등학생을 위한 공부 습관 체크 웹앱.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F4F1FA",
  "theme_color": "#F4F1FA",
  "lang": "ko",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

색은 `CoreRules` 7장의 배경색(아주 옅은 라벤더 `#F4F1FA`)과 같다.

#### `src/routes/__root.tsx` 의 `head()` 수정

`meta` 에 추가:

- `{ name: "theme-color", content: "#F4F1FA" }`
- `{ name: "apple-mobile-web-app-title", content: "공부체크" }`
- `{ name: "apple-mobile-web-app-status-bar-style", content: "default" }`

`meta` 에서 **제거**: `{ name: "twitter:site", content: "@Lovable" }`
— 러버블 흔적이고 이 앱의 계정이 아니다.

`links` 에 추가:

- `{ rel: "manifest", href: "/manifest.webmanifest" }`
- `{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" }`

기존 `viewport`(`viewport-fit=cover`), `apple-mobile-web-app-capable`,
`favicon.ico` 는 **그대로 둔다.**

> `apple-mobile-web-app-status-bar-style` 을 `default` 로 두는 이유: 본문이
> 이미 `env(safe-area-inset-top)` 로 패딩을 주고 있어 `black-translucent` 는
> 겹칠 수 있다. 실기기에서 어색하면 다음 사이클에서 바꾼다.

**아이콘 PNG 4개를 이 커밋에 포함한다.** 경로를 명시해 `git add` 할 것.
`public/drawable*` 는 절대 포함하지 말 것.

---

### 커밋 2 — 기능: 설정 시트 신설과 데이터 초기화

허용 파일: `src/lib/storage.ts`, `src/components/app/Screen.tsx`,
`src/components/app/SettingsSheet.tsx`(신규)

#### `src/lib/storage.ts`

- `clearState()` 를 추가한다. `STORAGE_KEY` 를 지운다.
  `CoreRules` 9장에 따라 **저장소 접근은 이 파일에서만** 한다.
  다른 파일에서 `localStorage` 를 직접 부르지 말 것.
- 옛 `v1` 키는 지우지 않는다. 현재 키만 지운다.
- 예외가 나도 앱이 죽지 않게 감쌀 것 (기존 함수들의 방식을 따를 것).

#### `src/components/app/SettingsSheet.tsx` 신규

- **`ListSheet.tsx` 와 같은 바텀시트 구조·톤으로 만든다.** 열림/닫힘 처리,
  배경 오버레이, 라운드, 여백을 그대로 따를 것. 새 패턴 금지.
- 내용은 **데이터 초기화 항목 하나만.** 3절 고정 문자열대로.
- **2단계 확인.** 첫 화면에는 `초기화` 버튼만 보이고, 누르면 같은 자리에서
  `정말 지울까요? 되돌릴 수 없어요.` 와 `네, 지울게요` / `취소` 로 바뀐다.
  브라우저 `confirm()` 을 쓰지 말 것 (홈 화면 앱에서 모양이 어색하다).
- `네, 지울게요` → `clearState()` 호출 후 `window.location.reload()`.
  리로드하면 `loadState` 가 시드 상태를 새로 만든다. 상태를 손으로 되돌리려
  하지 말 것.
- 색은 기존 토큰만 쓴다. 새 색을 하드코딩하지 말 것.
  초기화 버튼은 파괴적 동작이므로 주 색상(보라)을 쓰지 않는다.

#### `src/components/app/Screen.tsx`

- 톱니 버튼에 `onClick` 을 붙여 설정 시트를 연다.
- 열림 상태는 `Screen` 안에서 관리한다. 전역 상태를 만들지 말 것.
- 버튼 위치·크기·`aria-label="설정"` 은 그대로 둔다.

> **범위 주의:** 설정 시트에 알림·테마·프로필 같은 다른 항목을 넣지 말 것.
> 이번엔 데이터 초기화 하나뿐이다.

---

### 커밋 3 — 문서: PWA 절 추가 및 프리즈 절 중복 정리

허용 파일: `docs/CoreRules.md`, `docs/sessions/2026-08-22.md`

#### `CoreRules` 7장 "iOS 대응" 에 추가

> - `public/manifest.webmanifest` + `apple-touch-icon`(180) +
>   매니페스트 아이콘(192·512·maskable 512). 아이콘 원본은 안드로이드판의
>   햄스터(졸업모자)이고, 연보라 `#E8DFF7` 배경에 맞춰 정사각형으로 만들었다.
> - 홈 화면 추가 후에는 iOS 가 아이콘을 잘 갱신하지 않는다. 아이콘을 바꾸면
>   홈 화면에서 지우고 다시 추가해야 한다.

#### `CoreRules` 7장에 설정 시트 한 줄 추가

> 톱니를 누르면 설정 시트가 열린다. 현재 항목은 **데이터 초기화** 하나뿐이다.
> 홈 화면 웹앱은 콘솔을 쓸 수 없어 화면 안에 초기화 수단이 반드시 필요하다.

#### `CoreRules` 8장 프리즈 절 중복 정리 ★

지난 사이클에서 옛 문장과 새 문장이 겹쳐 "미구현" 안내가 두 번 나온다.
현재 이렇게 돼 있다.

```
### 스트릭 프리즈 — 웹판 미구현

안드로이드판에는 있으나 웹판에는 아직 없다. 나중에 붙일 때 `RewardSystemDesign.md` 4장 참고.

**미구현.** 붙일 때 규칙:
```

앞의 두 줄과 `**미구현.** 붙일 때 규칙:` 을 아래 한 줄로 합친다.
규칙 목록 본문은 그대로 둔다.

```
안드로이드판에는 있으나 웹판에는 아직 없다. 붙일 때 규칙은 아래와 같고,
더 자세한 배경은 `RewardSystemDesign.md` 4장 참고.
```

#### `CoreRules` 12장

실행 명령이 `npm run dev` 로 적혀 있는데 `CLAUDE.md` 는 `bun run dev` 다.
**로컬에 bun 이 설치돼 있지 않으므로 `npm run dev` 를 기준으로 통일**하고,
`bun.lock` 이 있지만 로컬에 bun 이 없어 npm 을 쓴다는 단서를 한 줄 단다.
`CLAUDE.md` 는 이번에 고치지 말고, 어긋난 채로 남았음을 보고할 것.

---

## 7. 검증

빌드하지 말 것. 대신 아래를 확인해 보고한다.

| # | 확인 | 방법 |
|---|------|------|
| 1 | 매니페스트가 유효한 JSON | `node -e` 로 파싱 |
| 2 | 매니페스트가 가리키는 아이콘 3개가 `public/` 에 실재 | 파일 존재 확인 |
| 3 | `apple-touch-icon.png` 실재 | 파일 존재 확인 |
| 4 | `head()` 에 manifest·apple-touch-icon·theme-color 링크가 들어감 | 해당 줄 인용 |
| 5 | `twitter:site` 가 사라짐 | grep 결과 |
| 6 | `localStorage` 직접 호출이 `storage.ts` 밖에 없음 | `grep -rn "localStorage" src/` |
| 7 | 타입 검사 | `npx tsc --noEmit` |
| 8 | 린트 | `npm run lint` — 기존 CRLF 경고 외 새 오류 없을 것 |

**화면 확인은 사용자가 한다.** dev 서버는 띄우지 말 것.

---

## 8. 제약 — 반드시 지켜라

- 수정 허용 파일은 6절에 나열된 것뿐. 그 외에 diff 가 생기면 실패로 간주한다.
  특히 `index.tsx` / `calendar.tsx` / `stats.tsx` / `rewards.tsx` /
  `StudyStore.tsx` / `TabBar.tsx` / `ListSheet.tsx` 는 건드리지 않는다.
- **`public/drawable*` 를 커밋에 넣지 말 것.** 삭제도 하지 말 것.
- 라이브러리 추가 금지. 서비스워커·오프라인 캐시를 넣지 말 것 (다음 기회).
- 무관한 리팩터링 금지: 함수 재배치, 변수명 정리, import 정리.
- 기존 화면의 색·여백·레이아웃 변경 금지.
- 새 파일은 `SettingsSheet.tsx` 와 `manifest.webmanifest` 둘뿐.
- **커밋 3개로 나눌 것.**

---

## 9. 완료 조건

- `git status` 와 `git diff --stat` 으로 변경 파일이 허용 범위뿐임을 보인다.
  `public/drawable*` 가 커밋에 없어야 한다.
- 7절 8개 확인의 결과 표.
- 커밋 3개의 해시와 메시지.
- `CLAUDE.md` 의 `bun run dev` 가 어긋난 채 남았음을 보고.
- `docs/sessions/2026-08-22.md` 에 이어 붙였는지 확인.

---

## 10. 다음 사이클 예고 (이번엔 하지 말 것)

- 마스코트 교체 (`char_hello/good/congrats/graduate` 4개로 빈 원 채우기)
- 보상 실데이터 (스트릭 완화 반영, 배지·트로피 판정)
- 서비스워커·오프라인 지원
