import { X } from "lucide-react";
import { Badge } from "@/components/app/Screen";
import type { BadgeProgress } from "@/lib/rewards";
import { parseDateKey } from "@/lib/studyDay";

/**
 * 날짜 키를 사람이 읽는 문구로. **문자열을 직접 자르지 않고 parseDateKey 를
 * 지난다** — 날짜 계산은 한 곳에서 한다(CoreRules 1장). 정오 기준 Date 를
 * 돌려주므로 시간대에 따라 하루가 밀리지 않는다.
 *
 * 획득일은 저장 데이터에서 온다. 옛 payload 나 손상된 값이면 없을 수 있으므로
 * 그때 화면이 죽지 않게 대비 문구를 둔다.
 */
function earnedText(date: string | null): string {
  if (!date) return "획득일을 알 수 없어요";
  const d = parseDateKey(date);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일에 받았어요`;
}

/**
 * 배지 상세. **획득일이 이 시트의 이유다** — 조건은 컬렉션에도 있지만
 * "이걸 언제 받았지" 에 답하는 곳은 여기뿐이다.
 *
 * 스토어를 읽지 않는다. 부모가 이미 가진 BadgeProgress 를 그대로 받는다.
 */
export function BadgeDetailSheet({
  badge,
  onClose,
}: {
  badge: BadgeProgress;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30"
      />
      <div
        className="relative w-full max-w-[420px] rounded-t-[20px] bg-background px-5 pt-5 shadow-soft"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-4 pb-4">
          {/* 192px 원본을 크게 쓴다. 격자의 72px 에서는 안 보이던 것이 보인다. */}
          <Badge code={badge.code} earned size={160} />
          <p className="text-2xl font-extrabold text-foreground">{badge.name}</p>
          <p className="text-base text-muted-foreground">{badge.requirement}</p>
          <p className="text-base font-bold text-purple">{earnedText(badge.date)}</p>
        </div>
      </div>
    </div>
  );
}
