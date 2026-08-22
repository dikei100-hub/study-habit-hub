import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Task } from "@/mockData";
import type { TemplateItem, TodosByDate } from "@/lib/seed";
import { todoIdFor } from "@/lib/seed";
import {
  BADGE_NAMES,
  badgeProgress,
  coinBalance,
  settleRewards,
  trophyProgress,
  type BadgeCode,
  type BadgeProgress,
  type TrophyProgress,
} from "@/lib/rewards";
import {
  createInitialState,
  loadState,
  saveState,
  type EarnedBadge,
  type PersistedState,
} from "@/lib/storage";
import { addDays, getStudyDate, monthKeys, parseDateKey, weekKeys } from "@/lib/studyDay";

/**
 * 리듀서가 들고 있는 상태. `justEarned` 는 축하 팝업만 보는 **임시 값이라
 * 저장하지 않는다** — saveState 가 세 필드만 골라 넘기므로 저장소에 새지 않는다.
 */
type StoreState = PersistedState & { justEarned: BadgeCode[] };

type Action =
  | { type: "hydrate"; state: PersistedState }
  | { type: "dismissBadgeCelebration" }
  | { type: "toggleTodo"; date: string; id: string }
  | { type: "addTemplate"; date: string; title: string }
  | { type: "setTemplateOnDate"; date: string; id: string; on: boolean }
  | { type: "removeTemplate"; date: string; id: string }
  | { type: "removeTodo"; date: string; id: string };

/**
 * 그 날짜의 **빈 목록**을 만든다(키가 없을 때만).
 *
 * 템플릿을 깔지 않는다. 어떤 날짜도 자동으로 채우지 않는 것이 규칙이고
 * (CoreRules 5장), 담기는 것은 리스트 관리에서 체크한 것뿐이다.
 * 편집 액션들이 이것을 먼저 부르므로, 그 날짜를 처음 건드리는 순간 빈 목록이
 * 생기고 거기에 담긴다. 둘러보기만으로는 아무것도 생기지 않는다.
 */
function materialize(state: StoreState, date: string): StoreState {
  if (date in state.todosByDate) return state;
  return { ...state, todosByDate: { ...state.todosByDate, [date]: [] } };
}

function baseReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "hydrate":
      // 저장값에는 justEarned 가 없다. 새로 연 세션은 축하 대기 없이 시작한다.
      return { ...action.state, justEarned: [] };
    case "toggleTodo": {
      const list = state.todosByDate[action.date];
      if (!list) return state;
      return {
        ...state,
        todosByDate: {
          ...state.todosByDate,
          [action.date]: list.map((t) =>
            t.id === action.id ? { ...t, done: !t.done } : t,
          ),
        },
      };
    }
    case "addTemplate": {
      const title = action.title.trim();
      if (!title) return state;
      const s = materialize(state, action.date);
      const id = `tpl-${Date.now()}`;
      const sortOrder = s.templates.reduce((min, t) => Math.min(min, t.sortOrder), 0) - 1;
      const list = s.todosByDate[action.date] ?? [];
      return {
        ...s,
        templates: [{ id, title, sortOrder }, ...s.templates],
        todosByDate: {
          ...s.todosByDate,
          [action.date]: [{ id: todoIdFor(action.date, id), title, done: false }, ...list],
        },
      };
    }
    // 체크박스는 "그 날짜 목록에 들어 있는가" 를 비추는 파생값이므로(CoreRules 2장)
    // 이 액션은 templates 배열을 건드리지 않고 그 날짜의 목록만 바꾼다.
    case "setTemplateOnDate": {
      const tpl = state.templates.find((t) => t.id === action.id);
      if (!tpl) return state;
      const s = materialize(state, action.date);
      const list = s.todosByDate[action.date] ?? [];
      const todoId = todoIdFor(action.date, action.id);
      let nextList = list;
      if (action.on) {
        if (!list.some((t) => t.id === todoId)) {
          // 템플릿 순서상 뒤에 오는 첫 항목 앞에 끼워 넣는다. 맨 뒤에 붙이면
          // 리스트 관리에 보이는 순서와 오늘의 할 일 순서가 어긋난다.
          const rank = new Map(
            [...s.templates]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((t, i) => [todoIdFor(action.date, t.id), i] as const),
          );
          const pos = rank.get(todoId) ?? s.templates.length;
          const at = list.findIndex((t) => (rank.get(t.id) ?? -1) > pos);
          const item = { id: todoId, title: tpl.title, done: false };
          nextList = at === -1 ? [...list, item] : [...list.slice(0, at), item, ...list.slice(at)];
        }
      } else {
        nextList = list.filter((t) => t.id !== todoId);
      }
      return {
        ...s,
        todosByDate: { ...s.todosByDate, [action.date]: nextList },
      };
    }
    case "removeTemplate": {
      const s = materialize(state, action.date);
      const list = s.todosByDate[action.date] ?? [];
      const todoId = todoIdFor(action.date, action.id);
      return {
        ...s,
        templates: s.templates.filter((t) => t.id !== action.id),
        todosByDate: {
          ...s.todosByDate,
          [action.date]: list.filter((t) => t.id !== todoId),
        },
      };
    }
    case "removeTodo": {
      const s = materialize(state, action.date);
      const list = s.todosByDate[action.date];
      if (!list) return state;
      return {
        ...s,
        todosByDate: { ...s.todosByDate, [action.date]: list.filter((t) => t.id !== action.id) },
      };
    }
    default:
      return state;
  }
}

/** EarnedBadge.code 는 string 이라 좁혀서 쓴다. 이름 맵에 있는 것만 배지 코드다. */
const isBadgeCode = (code: string): code is BadgeCode => code in BADGE_NAMES;

/**
 * 보상 정산. **리듀서 안에서** 한다 — 별도 이펙트로 빼면 이중 실행 위험이 있다.
 * 리듀서는 단일 스레드라 한 액션 안이면 그 자체로 원자적이다.
 *
 * CoreRules 8장 정산 순서는 코인 → 스트릭 → 배지다. 스트릭은 저장하지 않고
 * 매번 재계산하므로, 여기서 갱신된 기록으로 먼저 구해 배지 판정에 넘긴다.
 */
function settle(state: StoreState, celebrate: boolean): StoreState {
  const today = getStudyDate(new Date());
  const best = streakFor(state.todosByDate, today).best;
  const rewards = settleRewards(state.todosByDate, state.rewards, today, best);
  if (rewards === state.rewards) return state;
  // 무엇이 새로 들어왔는지는 정산 전후 목록의 차집합으로 안다. 판정 함수를
  // 건드리지 않으려는 것이다 — rewards.ts 는 이번 사이클에서 무수정이다.
  const before = new Set(state.rewards.earnedBadges.map((b) => b.code));
  const fresh = rewards.earnedBadges
    .filter((b) => !before.has(b.code))
    .map((b) => b.code)
    .filter(isBadgeCode);
  const justEarned =
    celebrate && fresh.length > 0 ? [...state.justEarned, ...fresh] : state.justEarned;
  return { ...state, rewards, justEarned };
}

/**
 * 상태가 바뀐 액션 뒤에는 항상 정산을 통과시킨다. hydrate 도 마찬가지다 —
 * 앱을 며칠 만에 열었을 때 그동안의 기록이 소급 판정되어야 한다.
 */
function reducer(state: StoreState, action: Action): StoreState {
  if (action.type === "dismissBadgeCelebration") {
    return state.justEarned.length === 0 ? state : { ...state, justEarned: [] };
  }
  const next = baseReducer(state, action);
  if (next === state) return state;
  // hydrate 정산은 축하하지 않는다. 앱을 열자마자 옛 배지로 팝업이 뜨면 안 된다.
  return settle(next, action.type !== "hydrate");
}

export type DayStats = { done: number; total: number; rate: number; hasRecord: boolean };

function statsFor(todos: TodosByDate, date: string): DayStats {
  const list = todos[date];
  // 묻는 것은 "화면에 보여줄 기록이 있나" 이므로 빈 배열은 false 다.
  // materialize 는 "이 날짜를 건드린 적이 있나" 를 키 존재로 묻는다. 기준이
  // 다른 것이 의도다. 그래야 담은 것이 없는 날은 달력에 0% 링 대신 `-` 가 뜨고
  // 스트릭도 그날에서 끊긴다. 통일하지 말 것.
  if (!list || list.length === 0) return { done: 0, total: 0, rate: 0, hasRecord: false };
  const done = list.filter((t) => t.done).length;
  return { done, total: list.length, rate: Math.round((done / list.length) * 100), hasRecord: true };
}

function rangeStats(todos: TodosByDate, keys: string[]) {
  let done = 0;
  let total = 0;
  for (const k of keys) {
    const s = statsFor(todos, k);
    done += s.done;
    total += s.total;
  }
  return { done, total, rate: total ? Math.round((done / total) * 100) : 0 };
}

/**
 * 스트릭이 하루에 인정되는가. **판정은 여기 한 곳뿐이다.**
 *
 * 완료 개수 ≥ 1 이면 인정한다. 그날 예정 개수와 무관하다 — 3개 중 1개만 해도
 * 인정. `statsFor` 가 기록 없는 날·빈 목록·total 0 을 모두 `done: 0` 으로
 * 돌려주므로 이 한 줄이 그 경우들까지 걸러낸다. (CoreRules 8장)
 *
 * 프리즈(방어된 날)를 붙일 때도 이 함수만 고치면 된다. 웹은 아직 미구현.
 */
function isStreakDay(todos: TodosByDate, date: string): boolean {
  return statsFor(todos, date).done >= 1;
}

/** 무한 방지 상한. 11년치라 여기 닿았다는 것 자체가 이상 상황이다. */
const STREAK_SCAN_LIMIT = 400;

/**
 * 연속 기록. 저장하지 않고 매번 기록에서 재계산한다.
 *
 * today 를 인자로 받는 이유: 시작점 유예가 "오늘"에 걸리는 규칙이라
 * 실제 시계에 의존하면 오늘 상태 하나만 확인하게 된다.
 */
export function streakFor(todos: TodosByDate, today: string): { current: number; best: number } {
  // 시작점 유예: 오늘이 아직 조건을 못 채웠으면 오늘을 실패로 세지 않고
  // 어제부터 센다. 진행 중인 하루를 끊김으로 처리하지 않기 위함.
  // 유예는 오늘 하루에만 준다. 시작점을 정한 뒤로는 예외 없이 과거로 센다.
  const start = isStreakDay(todos, today) ? today : addDays(today, -1);

  let current = 0;
  for (let i = 0; i < STREAK_SCAN_LIMIT; i += 1) {
    if (!isStreakDay(todos, addDays(start, -i))) break;
    current += 1;
  }

  const recorded = Object.keys(todos).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of recorded) {
    const consecutive = prev !== null && addDays(prev, 1) === key;
    if (isStreakDay(todos, key)) {
      run = consecutive && run > 0 ? run + 1 : 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    prev = key;
  }

  // 최고 기록은 줄어들지 않는다.
  return { current, best: Math.max(best, current) };
}

export type WeekDiff = { value: number; kind: "up" | "down" | "same" | "none" };

/**
 * "이번 주 경과분 vs 지난주 같은 경과분" 의 달성률 차이.
 *
 * 도넛이 재는 창(일~토 달력 주간)과 같은 것을 재도록, 아직 지나지 않은 요일은
 * 양쪽에서 모두 뺀다. 오늘이 수요일이면 이번 주 일~수 4일 vs 지난주 일~수 4일.
 *
 * today 를 인자로 받는 순수 함수인 이유: 주 경계(일요일=경과 1일,
 * 토요일=경과 7일)가 틀리기 쉬운 자리라 실제 시계와 무관하게 검증해야 한다.
 */
export function weekDiffFor(todos: TodosByDate, today: string): WeekDiff {
  const elapsed = weekKeys(today).filter((k) => k <= today);
  const previous = elapsed.map((k) => addDays(k, -7));
  const now = rangeStats(todos, elapsed);
  const before = rangeStats(todos, previous);
  // 한쪽이라도 기록이 없으면 비교 자체가 성립하지 않는다.
  if (now.total === 0 || before.total === 0) return { value: 0, kind: "none" };
  const diff = now.rate - before.rate;
  if (diff > 0) return { value: diff, kind: "up" };
  if (diff < 0) return { value: Math.abs(diff), kind: "down" };
  return { value: 0, kind: "same" };
}

type StudyStore = {
  today: string;
  todosByDate: TodosByDate;
  templates: TemplateItem[];
  toggleTodo: (date: string, id: string) => void;
  addTemplate: (date: string, title: string) => void;
  setTemplateOnDate: (date: string, id: string, on: boolean) => void;
  removeTemplate: (date: string, id: string) => void;
  removeTodo: (date: string, id: string) => void;
  canToggle: (date: string) => boolean;
  canManage: (date: string) => boolean;
  tasksFor: (date: string) => Task[] | undefined;
  previewFor: (date: string) => Task[];
  isTemplateOn: (date: string, id: string) => boolean;
  statsFor: (date: string) => DayStats;
  last7Days: { date: string; rate: number }[];
  weekStats: { done: number; total: number; rate: number };
  weekDiff: WeekDiff;
  monthStats: { done: number; total: number; rate: number };
  monthLabel: string;
  streak: { current: number; best: number };
  // 보상 셀렉터. 화면 연결은 B-2 에서 한다.
  coins: number;
  earnedBadges: EarnedBadge[];
  purchasedTrophies: string[];
  justEarned: BadgeCode[];
  dismissBadgeCelebration: () => void;
  badgeProgress: BadgeProgress[];
  trophyProgress: TrophyProgress[];
};

const StudyContext = createContext<StudyStore | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...createInitialState(),
    justEarned: [],
  }));

  useEffect(() => {
    dispatch({ type: "hydrate", state: loadState() });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<StudyStore>(() => {
    const todos = state.todosByDate;
    const today = getStudyDate(new Date());

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6);
      return { date, rate: statsFor(todos, date).rate };
    });

    const canToggle = (date: string) => date === today;
    const canManage = (date: string) => date >= today;

    return {
      today,
      todosByDate: todos,
      templates: [...state.templates].sort((a, b) => a.sortOrder - b.sortOrder),
      toggleTodo: (date, id) => {
        if (!canToggle(date)) return;
        dispatch({ type: "toggleTodo", date, id });
      },
      addTemplate: (date, title) => {
        if (!canManage(date)) return;
        dispatch({ type: "addTemplate", date, title });
      },
      setTemplateOnDate: (date, id, on) => {
        if (!canManage(date)) return;
        dispatch({ type: "setTemplateOnDate", date, id, on });
      },
      removeTemplate: (date, id) => {
        if (!canManage(date)) return;
        dispatch({ type: "removeTemplate", date, id });
      },
      removeTodo: (date, id) => {
        if (!canManage(date)) return;
        dispatch({ type: "removeTodo", date, id });
      },
      canToggle,
      canManage,
      tasksFor: (date) => todos[date],
      // 저장된 목록만 본다. 담지 않은 날짜는 빈 목록이다 — 미리보기를 만들지
      // 않는 것이 규칙이다(CoreRules 5장).
      previewFor: (date) => todos[date] ?? [],
      // 체크박스가 읽는 유일한 판정. 시트가 직접 계산하지 않게 여기 둔다.
      // 담지 않은 날짜에서는 전부 꺼진 상태로 보인다.
      isTemplateOn: (date, id) => (todos[date] ?? []).some((t) => t.id === todoIdFor(date, id)),
      statsFor: (date) => statsFor(todos, date),
      last7Days: last7,
      weekStats: rangeStats(todos, weekKeys(today)),
      weekDiff: weekDiffFor(todos, today),
      monthStats: rangeStats(todos, monthKeys(today)),
      // 화면이 날짜를 직접 계산하지 않게 여기서 만든다. (CoreRules 1장)
      monthLabel: `${parseDateKey(today).getMonth() + 1}월 달성률`,
      streak: streakFor(todos, today),
      coins: coinBalance(state.rewards),
      earnedBadges: state.rewards.earnedBadges,
      purchasedTrophies: state.rewards.purchasedTrophies,
      justEarned: state.justEarned,
      dismissBadgeCelebration: () => dispatch({ type: "dismissBadgeCelebration" }),
      badgeProgress: badgeProgress(state.rewards),
      trophyProgress: trophyProgress(state.rewards, coinBalance(state.rewards)),
    };
  }, [state]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyStore {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
