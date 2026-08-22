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

export function MascotSlot({ size = 96 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="shrink-0 rounded-full bg-muted"
      style={{ width: size, height: size }}
    />
  );
}