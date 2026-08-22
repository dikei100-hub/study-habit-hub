import type { TodosByDate } from "@/lib/seed";
import type { EarnedBadge, RewardsState } from "@/lib/storage";
import { addDays } from "@/lib/studyDay";

/**
 * 보상 판정. **순수 함수만 둔다** — React 를 import 하지 않는다.
 * 스토어가 호출하고, 검증은 이 파일을 그대로 Node 에서 돌린다.
 *
 * 이 파일이 지키는 한 가지 원칙: **한 번 준 것은 뺏지 않는다.**
 * 코인 지급 날짜와 획득 배지는 추가만 되고 빠지지 않는다.
 * (CrossTrack_RewardNotes [1]·[2], CoreRules 8장)
 */

/** 하루 100% 달성 시 지급액. 하루 한 번만. */
export const COIN_PER_PERFECT_DAY = 10;

/** CoreRules 8장 트로피 표. 구매는 C-2 이고 지금은 잔액·상태 계산에만 쓴다. */
export const TROPHY_PRICES: Record<string, number> = {
  bronze: 100,
  silver: 300,
  gold: 600,
};

/** 표시 이름. 가격 바로 옆에 두어 둘이 어긋나지 않게 한다. */
export const TROPHY_NAMES: Record<string, string> = {
  bronze: "브론즈 트로피",
  silver: "실버 트로피",
  gold: "골드 트로피",
};

/** 구매 가능 순서. 이전 등급을 사야 다음을 살 수 있다(CoreRules 8장). */
export const TROPHY_ORDER = ["bronze", "silver", "gold"] as const;

export type TrophyId = (typeof TROPHY_ORDER)[number];

/** CoreRules 8장의 두 축 + 누적·상점. */
export type BadgeAxis = "habit" | "perfect" | "cumulative" | "shop";

/**
 * 내부 식별자는 **의미 중립 코드**다. `streak_7` 처럼 뜻을 담으면 기준을 바꿀 때
 * 식별자와 실제가 어긋난다 — 안드로이드가 그 함정에 빠졌다(Lessons 2-5).
 * 표시 이름은 BADGE_NAMES 에 따로 둔다.
 */
export type BadgeCode =
  "b01" | "b02" | "b03" | "b04" | "b05" | "b06" | "b07" | "b08" | "b09" | "b10" | "b11" | "b12";

export const BADGE_NAMES: Record<BadgeCode, string> = {
  b01: "첫걸음",
  b02: "첫 연속",
  b03: "열공 7일",
  b04: "열공 30일",
  b05: "열공 100일",
  b06: "완벽한 주",
  b07: "완벽 마스터",
  b08: "노력왕",
  b09: "성실왕",
  b10: "공부왕",
  b11: "공부의 신",
  b12: "첫 트로피",
};

/**
 * 획득 조건을 **사용자 말로** 풀어쓴 것. 안드로이드는 `완벽한 날 50일` 처럼
 * 내부 용어를 그대로 노출해 뜻이 안 통했다(Lessons 1-3). 이름 바로 옆에 두어
 * 이름과 조건이 어긋나지 않게 한다.
 */
export const BADGE_REQUIREMENTS: Record<BadgeCode, string> = {
  b01: "하루 할 일 모두 완료",
  b02: "3일 연속 공부",
  b03: "공부한 날 7일",
  b04: "공부한 날 30일",
  b05: "공부한 날 100일",
  b06: "7일 연속 모두 완료",
  b07: "모두 완료한 날 50일",
  b08: "할 일 100개 완료",
  b09: "할 일 300개 완료",
  b10: "할 일 500개 완료",
  b11: "하루 5개 이상 완료 100일",
  b12: "트로피 첫 구매",
};

/** 날짜별 기록에서 뽑는 집계. today 보다 뒤인 날짜는 들어가지 않는다. */
export type DayAggregate = {
  perfectDays: number;
  studyDays: number;
  totalDone: number;
  daysWith5Plus: number;
  perfectWeek: boolean;
};

/** 배지 판정이 보는 값 전부. 스트릭과 트로피 수는 기록 밖에서 온다. */
export type RewardMetrics = DayAggregate & { streakBest: number; trophyCount: number };

type BadgeDef = { code: BadgeCode; axis: BadgeAxis; met: (m: RewardMetrics) => boolean };

/** CoreRules 8장 배지 표를 그대로 옮긴 것. 순서가 곧 표시 순서다. */
const BADGES: BadgeDef[] = [
  { code: "b01", axis: "perfect", met: (m) => m.perfectDays >= 1 },
  { code: "b02", axis: "habit", met: (m) => m.streakBest >= 3 },
  { code: "b03", axis: "habit", met: (m) => m.studyDays >= 7 },
  { code: "b04", axis: "habit", met: (m) => m.studyDays >= 30 },
  { code: "b05", axis: "habit", met: (m) => m.studyDays >= 100 },
  { code: "b06", axis: "perfect", met: (m) => m.perfectWeek },
  { code: "b07", axis: "perfect", met: (m) => m.perfectDays >= 50 },
  { code: "b08", axis: "cumulative", met: (m) => m.totalDone >= 100 },
  { code: "b09", axis: "cumulative", met: (m) => m.totalDone >= 300 },
  { code: "b10", axis: "cumulative", met: (m) => m.totalDone >= 500 },
  { code: "b11", axis: "cumulative", met: (m) => m.daysWith5Plus >= 100 },
  { code: "b12", axis: "shop", met: (m) => m.trophyCount >= 1 },
];

function dayCounts(todos: TodosByDate, date: string): { done: number; total: number } {
  const list = todos[date];
  if (!list || list.length === 0) return { done: 0, total: 0 };
  return { done: list.filter((t) => t.done).length, total: list.length };
}

/**
 * 완벽한 날 = 예정 개수 > 0 **그리고** 완료 == 예정.
 * ★ 예정이 0개인 날은 완벽이 아니다. 공짜 완벽을 주지 않는다(RewardNotes [4]).
 */
function isPerfectDay(todos: TodosByDate, date: string): boolean {
  const { done, total } = dayCounts(todos, date);
  return total > 0 && done === total;
}

/**
 * 오늘 포함 최근 7일이 모두 기록 존재 && 모두 완벽.
 * 예정 0개인 날이나 기록 없는 날이 하나라도 끼면 불성립 — 둘 다 total === 0 이라
 * 같은 한 줄에 걸린다.
 */
function hasPerfectWeek(todos: TodosByDate, today: string): boolean {
  for (let i = 0; i < 7; i += 1) {
    if (!isPerfectDay(todos, addDays(today, -i))) return false;
  }
  return true;
}

/** 코인을 줄 수 있는 날들. 정렬된 날짜 키. */
function perfectDates(todos: TodosByDate, today: string): string[] {
  return Object.keys(todos)
    .filter((date) => date <= today && isPerfectDay(todos, date))
    .sort();
}

/**
 * 기록에서 집계한다. **today 보다 뒤인 날짜는 전부 제외한다** —
 * 미래 날짜를 미리 만들어 둔 경우에도 보상이 앞당겨지지 않게.
 */
export function aggregate(todos: TodosByDate, today: string): DayAggregate {
  let perfectDays = 0;
  let studyDays = 0;
  let totalDone = 0;
  let daysWith5Plus = 0;

  for (const date of Object.keys(todos)) {
    if (date > today) continue;
    const { done, total } = dayCounts(todos, date);
    if (total > 0 && done === total) perfectDays += 1;
    if (done >= 1) studyDays += 1;
    // ★ "하루 5개 이상" 은 완료 개수 기준이다. 예정 개수가 아니다(RewardNotes [4]).
    if (done >= 5) daysWith5Plus += 1;
    totalDone += done;
  }

  return {
    perfectDays,
    studyDays,
    totalDone,
    daysWith5Plus,
    perfectWeek: hasPerfectWeek(todos, today),
  };
}

/**
 * 하루 정산. CoreRules 8장의 순서를 지킨다 — 코인 → 스트릭 → 배지.
 * 스트릭은 저장하지 않고 streakFor 가 계산하므로 그 best 를 인자로 받는다.
 *
 * 바뀐 게 없으면 **원래 객체를 그대로 돌려준다.** 매번 새 객체를 만들면
 * 불필요한 저장·리렌더가 일어난다.
 */
export function settleRewards(
  todos: TodosByDate,
  rewards: RewardsState,
  today: string,
  streakBest: number,
): RewardsState {
  // 1. 코인. 목록에 이미 있는 날짜는 다시 판정하지 않는다 — 이것이 하루 1회
  // 지급을 보장한다. 목록에서 날짜를 빼는 경로는 이 파일 어디에도 없다.
  const awarded = new Set(rewards.coinAwardedDates);
  const newlyAwarded = perfectDates(todos, today).filter((date) => !awarded.has(date));
  const coinAwardedDates = newlyAwarded.length
    ? [...rewards.coinAwardedDates, ...newlyAwarded].sort()
    : rewards.coinAwardedDates;

  // 2. 배지. 미획득 → 획득으로만 승격한다. 이미 획득한 것은 손대지 않으므로
  // 조건이 다시 거짓이 되어도 남는다.
  const owned = new Set<string>(rewards.earnedBadges.map((b) => b.code));
  const metrics: RewardMetrics = {
    ...aggregate(todos, today),
    streakBest,
    trophyCount: rewards.purchasedTrophies.length,
  };
  const fresh: EarnedBadge[] = BADGES.filter((b) => !owned.has(b.code) && b.met(metrics)).map(
    (b) => ({ code: b.code, date: today }),
  );
  const earnedBadges = fresh.length ? [...rewards.earnedBadges, ...fresh] : rewards.earnedBadges;

  if (coinAwardedDates === rewards.coinAwardedDates && earnedBadges === rewards.earnedBadges) {
    return rewards;
  }
  return { ...rewards, coinAwardedDates, earnedBadges };
}

/**
 * 잔액은 저장하지 않고 파생한다. 지급 날짜가 지워지지 않으므로 잔액도 줄지 않는다.
 * 안드로이드는 잔액을 숫자로 저장했는데(RewardNotes [2]), 그러면 지급 이력과
 * 잔액이 어긋날 수 있다.
 */
export function coinBalance(rewards: RewardsState): number {
  const spent = rewards.purchasedTrophies.reduce((sum, id) => sum + (TROPHY_PRICES[id] ?? 0), 0);
  return rewards.coinAwardedDates.length * COIN_PER_PERFECT_DAY - spent;
}

export type BadgeProgress = {
  code: BadgeCode;
  name: string;
  requirement: string;
  axis: BadgeAxis;
  earned: boolean;
  date: string | null;
};

/** 12종 전부. 미획득도 잠금 상태로 목록에 남는다(CoreRules 8장). */
export function badgeProgress(rewards: RewardsState): BadgeProgress[] {
  const earnedAt = new Map(rewards.earnedBadges.map((b) => [b.code, b.date]));
  return BADGES.map((b) => ({
    code: b.code,
    name: BADGE_NAMES[b.code],
    requirement: BADGE_REQUIREMENTS[b.code],
    axis: b.axis,
    earned: earnedAt.has(b.code),
    date: earnedAt.get(b.code) ?? null,
  }));
}

export type TrophyProgress = {
  id: TrophyId;
  name: string;
  price: number;
  owned: boolean;
  /** 이전 등급을 아직 안 샀을 때 그 트로피의 이름. 살 수 있으면 null. */
  blockedBy: string | null;
  affordable: boolean;
};

/**
 * 트로피 셋의 표시 상태. **판정만 한다** — 구매는 C-2 이고 여기서 상태를
 * 바꾸지 않는다. 문구 우선순위는 blockedBy 가 affordable 보다 앞선다:
 * 이전 등급이 없으면 코인이 얼마든 못 산다.
 */
export function trophyProgress(rewards: RewardsState, coins: number): TrophyProgress[] {
  const owned = new Set(rewards.purchasedTrophies);
  return TROPHY_ORDER.map((id, i) => {
    const prev = TROPHY_ORDER[i - 1];
    const price = TROPHY_PRICES[id] ?? 0;
    return {
      id,
      name: TROPHY_NAMES[id] ?? id,
      price,
      owned: owned.has(id),
      blockedBy: prev !== undefined && !owned.has(prev) ? (TROPHY_NAMES[prev] ?? prev) : null,
      affordable: coins >= price,
    };
  });
}

/**
 * 이 트로피를 지금 살 수 있는가. **trophyProgress 와 같은 판정을 쓴다** —
 * 두 곳에서 따로 계산하면 화면이 살 수 있다고 보여주는데 액션이 거부하는,
 * 눌러도 안 되는 버튼이 생긴다.
 *
 * 잔액을 빼는 것은 이 파일 어디에도 없다. 잔액은 파생값이라 purchasedTrophies
 * 에 하나 더하면 저절로 줄어든다(coinBalance).
 */
export function canPurchase(rewards: RewardsState, coins: number, id: string): boolean {
  const target = trophyProgress(rewards, coins).find((t) => t.id === id);
  if (!target) return false;
  return !target.owned && target.blockedBy === null && target.affordable;
}
