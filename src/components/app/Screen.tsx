import { Settings } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SettingsSheet } from "@/components/app/SettingsSheet";
import type { BadgeCode } from "@/lib/rewards";

export function Screen({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="mx-auto w-full max-w-[420px] px-5 pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            aria-label="설정"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-lilac"
          >
            <Settings size={22} />
          </button>
        </div>
        {children}
      </div>
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export function Card({
  children,
  tone = "surface",
  className = "",
}: {
  children: ReactNode;
  tone?: "surface" | "lilac" | "sky" | "lemon" | "blush";
  className?: string;
}) {
  const tones = {
    surface: "bg-surface",
    lilac: "bg-lilac",
    sky: "bg-sky",
    lemon: "bg-lemon",
    blush: "bg-blush",
  } as const;
  return (
    <div className={`rounded-[20px] p-5 shadow-soft ${tones[tone]} ${className}`}>{children}</div>
  );
}

// 배지 파일명은 옛 코드라 현재 조건과 다르다(badge_study_10 이 "누적 100개"다).
// 화면이 경로를 직접 쓰지 않도록 매핑은 여기 한 곳에만 둔다.
// 기준은 CrossTrack_Assets.md 2절이고, 파일명으로 짐작하지 말 것.
const badgeSrc: Record<BadgeCode, string> = {
  b01: "/badge_first_step.png", // 첫걸음 — 첫 완벽 달성
  b02: "/badge_streak_3.png", // 첫 연속 — 3일 연속
  b03: "/badge_streak_7.png", // 열공 7일 — 공부한 날 누적 7일
  b04: "/badge_streak_30.png", // 열공 30일 — 누적 30일
  b05: "/badge_streak_100.png", // 열공 100일 — 누적 100일
  b06: "/badge_perfect_week.png", // 완벽한 주 — 최근 7일 모두 100%
  b07: "/badge_perfect_50.png", // 완벽 마스터 — 완벽한 날 50일
  b08: "/badge_study_10.png", // 노력왕 — 누적 완료 100개
  b09: "/badge_study_50.png", // 성실왕 — 누적 완료 300개
  b10: "/badge_study_100.png", // 공부왕 — 누적 완료 500개
  b11: "/badge_day5_100.png", // 공부의 신 — 하루 5개 이상 완료한 날 100일
  b12: "/badge_trophy_first.png", // 첫 트로피 — 트로피 첫 구매
};

/**
 * 미획득은 숨기지 않고 흐리게 둔다. 목표가 보여야 동기가 된다(CoreRules 8장).
 * 새 색을 만들지 않으려고 회색조 + 불투명도 유틸리티만 쓴다.
 */
export function Badge({
  code,
  earned,
  size = 72,
}: {
  code: BadgeCode;
  earned: boolean;
  size?: number;
}) {
  return (
    <img
      src={badgeSrc[code]}
      alt=""
      aria-hidden
      className={earned ? "" : "opacity-40 grayscale"}
      style={{ width: size, height: size }}
    />
  );
}

const trophySrc = {
  bronze: "/trophy_bronze.png",
  silver: "/trophy_silver.png",
  gold: "/trophy_gold.png",
} as const;

export type TrophyId = keyof typeof trophySrc;

export function Trophy({ id, size = 72 }: { id: TrophyId; size?: number }) {
  return <img src={trophySrc[id]} alt="" aria-hidden style={{ width: size, height: size }} />;
}

// 화면들이 파일 경로를 직접 쓰지 않도록 매핑은 여기 한 곳에만 둔다.
const mascotSrc = {
  hello: "/char_hello.png",
  good: "/char_good.png",
  congrats: "/char_congrats.png",
  graduate: "/char_graduate.png",
} as const;

export type MascotKind = keyof typeof mascotSrc;

export function Mascot({ kind, size = 96 }: { kind: MascotKind; size?: number }) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-blush"
      style={{ width: size, height: size }}
    >
      {/* 원에 꽉 채우면 귀·모자가 잘린 것처럼 보여 지름의 82%로 둔다. */}
      <img src={mascotSrc[kind]} alt="" style={{ width: size * 0.82, height: size * 0.82 }} />
    </div>
  );
}