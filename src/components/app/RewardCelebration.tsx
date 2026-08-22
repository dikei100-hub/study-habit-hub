import { useEffect } from "react";
import { Badge, Trophy } from "@/components/app/Screen";
import type { CelebrationItem } from "@/state/StudyStore";

// Screen 이 이 파일을 import 하고 이 파일이 Screen 의 Badge·Trophy 를 import 하므로
// 순환 import 다. 양쪽 다 최상위에서 상대 바인딩을 읽지 않고 컴포넌트 함수 안에서만
// 호출하므로 ESM 에서 안전하다. 최상위에서 쓰기 시작하면 깨지니 그러지 말 것.
// (seed.ts ↔ devSeed.ts 와 같은 조건이다.)

/** 오래 잡아두면 방해가 된다. 안드로이드 구매 팝업(약 1.5초)보다 조금 길게. */
const AUTO_CLOSE_MS = 2500;

export function RewardCelebration({
  items,
  onClose,
}: {
  items: CelebrationItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  // 첫 구매는 트로피와 b12 를 함께 준다. 팝업을 따로 띄우면 둘이 겹치므로
  // 하나의 팝업이 함께 보여준다.
  const first = items[0];
  if (!first) return null;
  const title = items.length === 1 ? `${first.name} 획득!` : `${items.length}개 획득!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30"
      />
      <div
        role="status"
        className="relative mx-5 flex w-full max-w-[320px] flex-col items-center gap-4 rounded-[20px] bg-background px-6 py-7 shadow-soft motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((item) =>
            item.kind === "badge" ? (
              <Badge key={item.id} code={item.id} earned size={88} />
            ) : (
              <Trophy key={item.id} id={item.id} size={88} />
            ),
          )}
        </div>
        <p className="text-center text-xl font-extrabold text-foreground">{title}</p>
        <p className="text-center text-base text-muted-foreground">오늘도 한 걸음 나아갔어요 💜</p>
      </div>
    </div>
  );
}
