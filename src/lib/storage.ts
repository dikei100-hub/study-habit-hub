import type { TemplateItem, TodosByDate } from "@/lib/seed";
import { createSeedTemplates, createSeedTodos, fillFromTemplate } from "@/lib/seed";
import { getStudyDate } from "@/lib/studyDay";

// v2: 템플릿에서 on/off 플래그를 없앴다(CoreRules 2장 재정의). 마이그레이션은
// 두지 않고 v1 키는 지우지 않은 채 남겨 둔다.
const STORAGE_KEY = "studymate.state.v2";

export type PersistedState = { todosByDate: TodosByDate; templates: TemplateItem[] };

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

function normalizeTemplates(value: unknown): TemplateItem[] {
  if (!Array.isArray(value)) return createSeedTemplates();
  const items = value.filter(
    (t): t is TemplateItem =>
      !!t && typeof t === "object" && typeof t.id === "string" && typeof t.title === "string",
  );
  if (items.length === 0) return createSeedTemplates();
  // 스프레드로 옛 스키마의 플래그가 흘러들지 않도록 필요한 필드만 명시적으로 뽑는다.
  return items.map((t, i) => ({
    id: t.id,
    title: t.title,
    sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : i,
  }));
}

export function createInitialState(): PersistedState {
  const templates = createSeedTemplates();
  const todosByDate = fillFromTemplate(createSeedTodos(), getStudyDate(new Date()), templates);
  return { todosByDate, templates };
}

/** 저장된 상태를 읽는다. 없거나 깨졌으면 초기값. */
export function loadState(): PersistedState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return createInitialState();
    const templates = normalizeTemplates((parsed as PersistedState).templates);
    return {
      templates,
      todosByDate: fillFromTemplate(parsed.todosByDate, getStudyDate(new Date()), templates),
    };
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

/**
 * 저장된 상태를 지운다. 설정 시트의 "데이터 초기화" 가 부른다.
 * 옛 v1 키는 건드리지 않고 현재 키만 지운다.
 */
export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 삭제 실패는 무시 */
  }
}
