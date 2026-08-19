import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Task } from "@/mockData";
import type { TodosByDate } from "@/lib/seed";
import { createInitialState, loadState, saveState, type PersistedState } from "@/lib/storage";
import { addDays, getStudyDate, monthKeys, weekKeys } from "@/lib/studyDay";

type Action =
  | { type: "hydrate"; state: PersistedState }
  | { type: "toggleTodo"; date: string; id: string };

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
    default:
      return state;
  }
}

export type DayStats = { done: number; total: number; rate: number; hasRecord: boolean };

function statsFor(todos: TodosByDate, date: string): DayStats {
  const list = todos[date];
  if (!list || list.length === 0) return { done: 0, total: 0, rate: 0, hasRecord: !!list };
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
  toggleTodo: (date: string, id: string) => void;
  tasksFor: (date: string) => Task[] | undefined;
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

    return {
      today,
      todosByDate: todos,
      toggleTodo: (date, id) => dispatch({ type: "toggleTodo", date, id }),
      tasksFor: (date) => todos[date],
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
