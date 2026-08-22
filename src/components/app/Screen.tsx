import { Settings } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SettingsSheet } from "@/components/app/SettingsSheet";

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

// 배지 이미지는 아직 없다. 배지 격자에서 자리만 잡는 회색 원.
// 배지 12종을 붙이는 사이클에서 이것을 갈아끼운다.
export function BadgeSlot({ size = 96 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="shrink-0 rounded-full bg-muted"
      style={{ width: size, height: size }}
    />
  );
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