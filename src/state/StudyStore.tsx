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
import { fillFromTemplate, todoIdFor } from "@/lib/seed";
import { createInitialState, loadState, saveState, type PersistedState } from "@/lib/storage";
import { addDays, getStudyDate, monthKeys, parseDateKey, weekKeys } from "@/lib/studyDay";

type Action =
  | { type: "hydrate"; state: PersistedState }
  | { type: "toggleTodo"; date: string; id: string }
  | { type: "ensureDate"; date: string }
  | { type: "addTemplate"; date: string; title: string }
  | { type: "setTemplateOnDate"; date: string; id: string; on: boolean }
  | { type: "removeTemplate"; date: string; id: string }
  | { type: "removeTodo"; date: string; id: string };

/**
 * 그 날짜의 할 일을 실제로 만든다(없을 때만).
 * 미래 날짜는 둘러보기만으로 만들지 않는다. 사용자가 실제로 편집할 때
 * 이 시점에 만들어야 통계와 달력에 계획한 적 없는 0% 기록이 남지 않는다.
 */
function materialize(state: PersistedState, date: string): PersistedState {
  const next = fillFromTemplate(state.todosByDate, date, state.templates);
  return next === state.todosByDate ? state : { ...state, todosByDate: next };
}

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case "hydrate":
      return action.state;
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
    case "ensureDate":
      return materialize(state, action.date);
    case "addTemplate": {
      const title = action.title.trim();
      if (!title) return state;
      const s = materialize(state, action.date);
      const id = `tpl-${Date.now()}`;
      const sortOrder = s.templates.reduce((min, t) => Math.min(min, t.sortOrder), 0) - 1;
      const list = s.todosByDate[action.date] ?? [];
      return {
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

export type DayStats = { done: number; total: number; rate: number; hasRecord: boolean };

function statsFor(todos: TodosByDate, date: string): DayStats {
  const list = todos[date];
  // 묻는 것은 "화면에 보여줄 기록이 있나" 이므로 빈 배열은 false 다.
  // fillFromTemplate 은 "만든 적이 있나" 를 키 존재로 묻는다. 기준이 다른 것이
  // 의도다. 그래야 사용자가 비운 날은 다시 깔리지 않으면서 달력에는 0% 링 대신
  // `-` 가 뜨고 스트릭도 그날에서 끊긴다. 통일하지 말 것.
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
  ensureDate: (date: string) => void;
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
};

const StudyContext = createContext<StudyStore | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

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
      ensureDate: (date) => dispatch({ type: "ensureDate", date }),
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
      // 저장된 목록이 있으면 그것, 없으면 템플릿으로 만든 미리보기.
      // 미리보기는 저장되지 않는다. 기록이 없는 과거 날짜는 빈 목록이다.
      previewFor: (date) =>
        todos[date] ??
        (canManage(date) ? (fillFromTemplate({}, date, state.templates)[date] ?? []) : []),
      // 체크박스가 읽는 유일한 판정. 시트가 직접 계산하지 않게 여기 둔다.
      isTemplateOn: (date, id) => {
        const list =
          todos[date] ??
          (canManage(date) ? (fillFromTemplate({}, date, state.templates)[date] ?? []) : []);
        return list.some((t) => t.id === todoIdFor(date, id));
      },
      statsFor: (date) => statsFor(todos, date),
      last7Days: last7,
      weekStats: rangeStats(todos, weekKeys(today)),
      weekDiff: weekDiffFor(todos, today),
      monthStats: rangeStats(todos, monthKeys(today)),
      // 화면이 날짜를 직접 계산하지 않게 여기서 만든다. (CoreRules 1장)
      monthLabel: `${parseDateKey(today).getMonth() + 1}월 달성률`,
      streak: streakFor(todos, today),
    };
  }, [state]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyStore {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
