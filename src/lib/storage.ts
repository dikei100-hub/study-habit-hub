import type { TodosByDate } from "@/lib/seed";
import { createSeedTodos } from "@/lib/seed";

const STORAGE_KEY = "studymate.state.v1";

export type PersistedState = { todosByDate: TodosByDate };

function isValid(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const todos = (value as PersistedState).todosByDate;
  if (!todos || typeof todos !== "object") return false;
  return Object.values(todos).every(
    (list) =>
      Array.isArray(list) &&
      list.every(
        (t) =>
          t &&
          typeof t === "object" &&
          typeof t.id === "string" &&
          typeof t.title === "string" &&
          typeof t.done === "boolean",
      ),
  );
}

export function createInitialState(): PersistedState {
  return { todosByDate: createSeedTodos() };
}

/** 저장된 상태를 읽는다. 없거나 깨졌으면 초기값. */
export function loadState(): PersistedState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 저장 실패는 무시 */
  }
}
