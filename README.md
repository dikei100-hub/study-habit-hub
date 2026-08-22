# 공부체크 StudyMate — 웹(iOS) 버전

고등학생용 공부 습관 체크 앱의 웹 버전. 아이폰 홈 화면에 추가해서 쓰는 모바일 웹앱이다.
운영 중인 안드로이드판을 웹으로 옮기면서, iOS 한 손 조작에 맞게 화면 구성을 바꿨다.

매일 같은 일을 반복하는 사용자를 위한 앱이다. 리스트 관리 목록이 기준이 되고,
그 목록이 매일 그대로 넘어간다.

## 화면

하단 고정 탭 4개.

| 탭 | 내용 |
|----|------|
| **오늘** | 오늘 달성률, 연속 공부 일수, 오늘의 할 일 체크 |
| **통계** | 최근 7일 막대, 이번 주·이번 달 달성률 도넛 |
| **캘린더** | 월 그리드에 날짜별 달성률 링. 날짜를 골라 그날 기록 확인 |
| **보상** | 배지·트로피 컬렉션 *(아직 정적 화면)* |

설정은 탭에 없다. 각 화면 오른쪽 위 톱니 아이콘으로 들어간다.

### 알아둘 규칙 두 가지

- **하루는 자정이 아니라 새벽 4시에 바뀐다.** `04:00 ~ 다음날 03:59` 가 같은 날이다.
  밤 12시를 넘겨 공부한 것을 전날 기록으로 잡기 위함이다.
- **날짜별 편집 권한이 다르다.** 과거는 읽기 전용, 오늘만 완료 체크 가능,
  미래는 계획만 세울 수 있다.

## 기술 스택

- **TanStack Start** (SSR) + **TanStack Router** 파일 기반 라우팅
- **React 19** / **TypeScript** / **Vite**
- **Tailwind CSS v4** — 색상은 `src/styles.css` 한 곳에 oklch 변수로 정의
- 아이콘은 **lucide-react** 만 사용
- **차트 라이브러리를 쓰지 않는다.** 막대와 도넛 링은 div/CSS 또는 인라인 SVG로 직접 만든다

백엔드와 로그인이 없다. **모든 데이터는 브라우저 localStorage 에 저장된다.**
저장소 접근은 `src/lib/storage.ts` 를 통해서만 한다 — 나중에 Supabase 로 교체할 때
이 파일 하나만 고치면 되도록 유지한다.

## 실행

```sh
npm install
npm run dev        # http://localhost:8080
```

실기기 확인은 같은 와이파이에서 `http://<PC IP>:8080`.

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint (Prettier 포함) |
| `npm run format` | Prettier 일괄 적용 |

테스트 도구는 아직 없다.

> `bun.lock` 이 커밋된 락파일이다. bun 을 쓰면 `bunfig.toml` 의 24시간 공급망 가드
> (`minimumReleaseAge`)가 함께 적용된다. npm 으로 설치해도 동작하지만 그 가드는 적용되지 않는다.

## 저장 데이터 초기화

localStorage 키는 `studymate.state.v1` 이다. 시드 데이터부터 다시 보려면
DevTools 콘솔에서:

```js
localStorage.removeItem("studymate.state.v1"); location.reload();
```

## 문서

**`docs/CoreRules.md` 가 웹 트랙의 최종 기준이다.** 다른 문서와 충돌하면 이 문서를 따른다.
하루 경계, 두 목록의 체크박스 의미, 날짜별 편집 규칙, 보상 규칙, 알려진 이슈가 들어 있다.

| 문서 | 성격 |
|------|------|
| `docs/CoreRules.md` | **웹 트랙 확정 규칙. 최우선.** |
| `docs/RewardSystemDesign.md` | 보상 규칙 (비교적 최신) |
| `docs/DateBasedTodoDesign.md` | 날짜별 할 일 설계 |
| `docs/ScreenDesign.md`, `docs/FunctionalSpec.md` | 안드로이드판 기준. **낡음, 참고만** |
| `docs/WorkLog-*.md` | 작업 기록 — 무엇을 왜 고쳤는지 |
| `CLAUDE.md` | Claude Code 용 저장소 안내 |

낡은 문서의 어떤 내용을 따르면 안 되는지는 `CoreRules.md` 0장에 표로 정리되어 있다.
문서와 실제 화면이 다르면 **화면이 정답이다.**
