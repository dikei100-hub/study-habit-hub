import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Trophy } from "lucide-react";
import { Card, MascotSlot, Screen } from "@/components/app/Screen";
import { badges, trophies } from "@/mockData";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "보상 — 공부체크" },
      { name: "description", content: "꾸준히 모은 코인으로 배지와 트로피를 채워보세요." },
      { property: "og:title", content: "보상 — 공부체크" },
      { property: "og:description", content: "획득한 배지와 트로피를 모아보는 나만의 컬렉션." },
    ],
  }),
  component: RewardsScreen,
});

function RewardsScreen() {
  return (
    <Screen>
      <Card tone="blush" className="mb-5 flex items-center gap-4">
        <MascotSlot size={88} />
        <div>
          <h1 className="text-xl font-extrabold text-foreground">잘하고 있어요! 🎉</h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            꾸준히 모은 코인으로 나만의 보상을 채워봐요 💜
          </p>
        </div>
      </Card>

      <button
        type="button"
        className="mb-5 flex w-full items-center justify-between rounded-[20px] bg-lilac px-5 py-5 shadow-soft"
      >
        <span className="text-lg font-bold text-foreground">내 컬렉션 모두 보기</span>
        <ChevronRight size={22} className="text-muted-foreground" />
      </button>

      <Card tone="lilac" className="mb-5">
        <h2 className="text-lg font-extrabold text-foreground">획득한 배지</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {badges.map((b) => (
            <li
              key={b.id}
              className="flex flex-col items-center gap-3 rounded-[18px] bg-surface px-3 py-5"
            >
              <MascotSlot size={72} />
              <span className="text-base font-bold text-foreground">{b.name}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="lilac">
        <h2 className="text-lg font-extrabold text-foreground">획득한 트로피</h2>
        {trophies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-24 items-center justify-center rounded-full bg-muted">
              <Trophy size={40} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">아직 트로피가 없어요. 오늘도 한 걸음!</p>
          </div>
        ) : null}
      </Card>
    </Screen>
  );
}