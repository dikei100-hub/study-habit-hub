import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Coins, Trophy as TrophyIcon } from "lucide-react";
import { CollectionSheet } from "@/components/app/CollectionSheet";
import { Badge, Card, Mascot, Screen, Trophy } from "@/components/app/Screen";
import { TROPHY_NAMES, TROPHY_ORDER, type TrophyId } from "@/lib/rewards";
import { useStudy } from "@/state/StudyStore";

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

// 이름은 rewards.ts 의 TROPHY_NAMES 한 곳에서만 온다. 같은 이름을 두 곳에
// 두면 반드시 어긋난다.
const isTrophyId = (id: string): id is TrophyId => (TROPHY_ORDER as readonly string[]).includes(id);

function RewardsScreen() {
  const { coins, badgeProgress, purchasedTrophies } = useStudy();
  const [collectionOpen, setCollectionOpen] = useState(false);
  // 보상 탭은 "받은 것을 본다". 전체 12종과 조건은 컬렉션에 있다.
  const earned = badgeProgress.filter((b) => b.earned);
  const owned = purchasedTrophies.filter(isTrophyId);

  return (
    <Screen>
      <Card tone="blush" className="mb-5 flex items-center gap-4">
        <Mascot kind="congrats" size={88} />
        <div>
          <h1 className="text-xl font-extrabold text-foreground">잘하고 있어요! 🎉</h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            꾸준히 모은 코인으로 나만의 보상을 채워봐요 💜
          </p>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setCollectionOpen(true)}
        className="mb-5 flex w-full items-center justify-between rounded-[20px] bg-lilac px-5 py-5 shadow-soft"
      >
        <span className="text-lg font-bold text-foreground">내 컬렉션 모두 보기</span>
        <span className="flex items-center gap-2">
          {/* 컬렉션 헤더의 알약과 같은 모양이다. 들어가서도 이어져 보여야 한다. */}
          <span className="flex items-center gap-1.5 rounded-full bg-lemon px-3 py-1.5 text-base font-bold text-foreground">
            <Coins size={16} className="text-muted-foreground" />
            {coins}
          </span>
          <ChevronRight size={22} className="text-muted-foreground" />
        </span>
      </button>

      <Card tone="lilac" className="mb-5">
        <h2 className="text-lg font-extrabold text-foreground">획득한 배지</h2>
        {earned.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            아직 배지가 없어요. 첫 배지를 받아볼까요?
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4">
            {earned.map((b) => (
              <li
                key={b.code}
                className="flex flex-col items-center gap-3 rounded-[18px] bg-surface px-3 py-5"
              >
                <Badge code={b.code} earned size={72} />
                <span className="text-base font-bold text-foreground">{b.name}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card tone="lilac">
        <h2 className="text-lg font-extrabold text-foreground">획득한 트로피</h2>
        {owned.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-24 items-center justify-center rounded-full bg-muted">
              <TrophyIcon size={40} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">아직 트로피가 없어요. 오늘도 한 걸음!</p>
          </div>
        ) : (
          // 구매는 B-3 이다. 여기서는 보유한 것을 보여주기만 한다.
          <ul className="mt-4 grid grid-cols-3 gap-4">
            {owned.map((id) => (
              <li
                key={id}
                className="flex flex-col items-center gap-3 rounded-[18px] bg-surface px-3 py-5"
              >
                <Trophy id={id} size={72} />
                <span className="text-base font-bold text-foreground">{TROPHY_NAMES[id]}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {collectionOpen && <CollectionSheet onClose={() => setCollectionOpen(false)} />}
    </Screen>
  );
}
