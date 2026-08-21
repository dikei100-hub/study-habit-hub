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
import { addDays, getStudyDate, monthKeys, weekKeys } from "@/lib/studyDay";

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
  monthStats: { done: number; total: number; rate: number };
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

    let current = 0;
    for (let i = 0; ; i += 1) {
      const s = statsFor(todos, addDays(today, -i));
      if (!s.hasRecord || s.total === 0 || s.rate < 100) break;
      current += 1;
    }

    const recorded = Object.keys(todos).sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const key of recorded) {
      const s = statsFor(todos, key);
      const consecutive = prev !== null && addDays(prev, 1) === key;
      if (s.total > 0 && s.rate === 100) {
        run = consecutive && run > 0 ? run + 1 : 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
      prev = key;
    }

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
      monthStats: rangeStats(todos, monthKeys(today)),
      streak: { current, best: Math.max(best, current) },
    };
  }, [state]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyStore {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
