import { useEffect } from "react";
import { Badge } from "@/components/app/Screen";
import { BADGE_NAMES, type BadgeCode } from "@/lib/rewards";

// Screen 이 이 파일을 import 하고 이 파일이 Screen 의 Badge 를 import 하므로
// 순환 import 다. 양쪽 다 최상위에서 상대 바인딩을 읽지 않고 컴포넌트 함수 안에서만
// 호출하므로 ESM 에서 안전하다. 최상위에서 쓰기 시작하면 깨지니 그러지 말 것.
// (seed.ts ↔ devSeed.ts 와 같은 조건이다.)

/** 오래 잡아두면 방해가 된다. 안드로이드 구매 팝업(약 1.5초)보다 조금 길게. */
const AUTO_CLOSE_MS = 2500;

export function BadgeCelebration({ codes, onClose }: { codes: BadgeCode[]; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const first = codes[0];
  if (!first) return null;
  const title = codes.length === 1 ? `${BADGE_NAMES[first]} 획득!` : `배지 ${codes.length}개 획득!`;

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
          {codes.map((code) => (
            <Badge key={code} code={code} earned size={88} />
          ))}
        </div>
        <p className="text-center text-xl font-extrabold text-foreground">{title}</p>
        <p className="text-center text-base text-muted-foreground">오늘도 한 걸음 나아갔어요 💜</p>
      </div>
    </div>
  );
}
