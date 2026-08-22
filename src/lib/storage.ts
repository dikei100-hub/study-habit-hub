import type { TemplateItem, TodosByDate } from "@/lib/seed";
import { createSeedTemplates, createSeedTodos } from "@/lib/seed";

// v2: 템플릿에서 on/off 플래그를 없앴다(CoreRules 2장 재정의). 마이그레이션은
// 두지 않고 v1 키는 지우지 않은 채 남겨 둔다.
// rewards 를 붙이면서도 키를 올리지 않았다. isValid 가 todosByDate 만 보고
// rewards 는 templates 처럼 따로 정규화하므로 옛 payload 가 그대로 살아남는다.
const STORAGE_KEY = "studymate.state.v2";

/** 획득한 배지와 획득일. code 는 b01 같은 의미 중립 코드다(CoreRules 8장). */
export type EarnedBadge = { code: string; date: string };

export type RewardsState = {
  earnedBadges: EarnedBadge[];
  /** 코인을 지급한 날짜. 여기서 빠지는 일은 없다 — 회수하지 않는다. */
  coinAwardedDates: string[];
  purchasedTrophies: string[];
};

export type PersistedState = {
  todosByDate: TodosByDate;
  templates: TemplateItem[];
  rewards: RewardsState;
};

export function createEmptyRewards(): RewardsState {
  return { earnedBadges: [], coinAwardedDates: [], purchasedTrophies: [] };
}

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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function normalizeEarnedBadges(value: unknown): EarnedBadge[] {
  if (!Array.isArray(value)) return [];
  const items = value.filter(
    (b): b is EarnedBadge =>
      !!b && typeof b === "object" && typeof b.code === "string" && typeof b.date === "string",
  );
  // normalizeTemplates 와 같은 이유로 스프레드하지 않고 필요한 필드만 뽑는다.
  return items.map((b) => ({ code: b.code, date: b.date }));
}

/**
 * 없거나 깨졌으면 빈 보상 상태. templates 와 달리 시드가 없다 —
 * 보상은 기록에서 소급 판정되므로 빈 값에서 시작해도 잃는 것이 없다.
 */
function normalizeRewards(value: unknown): RewardsState {
  if (!value || typeof value !== "object") return createEmptyRewards();
  const raw = value as Record<string, unknown>;
  return {
    earnedBadges: normalizeEarnedBadges(raw["earnedBadges"]),
    coinAwardedDates: normalizeStringArray(raw["coinAwardedDates"]),
    purchasedTrophies: normalizeStringArray(raw["purchasedTrophies"]),
  };
}

export function createInitialState(): PersistedState {
  return {
    todosByDate: createSeedTodos(),
    templates: createSeedTemplates(),
    rewards: createEmptyRewards(),
  };
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
    // 저장된 것을 그대로 돌려준다. 자동으로 채우지 않는다(CoreRules 5장).
    return {
      templates,
      todosByDate: parsed.todosByDate,
      rewards: normalizeRewards(parsed.rewards),
    };
  } catch {
    return createInitialState();
  }
}

/**
 * 저장할 세 필드를 **명시적으로 골라서** 직렬화한다. 리듀서는 화면용 임시 값
 * (justEarned 등)도 함께 들고 있는데, 통째로 넘기면 그것까지 저장돼 저장소가
 * 오염된다. 거르는 자리를 저장 경계인 여기에 두어 호출부가 늘어도 안전하게 한다.
 */
export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    const { todosByDate, templates, rewards } = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ todosByDate, templates, rewards }));
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
