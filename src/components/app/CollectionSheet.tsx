import { Coins, X } from "lucide-react";
import { Badge, Trophy } from "@/components/app/Screen";
import { useStudy } from "@/state/StudyStore";

/**
 * 내 컬렉션. 보상 탭이 "받은 것을 본다" 라면 여기는 "전부 보고 모은다" 다.
 * 미획득도 조건과 함께 보인다 — 목표가 보여야 동기가 된다(CoreRules 8장).
 *
 * 구매는 C-2 다. 이 파일에는 상태를 바꾸는 코드가 없고, 구매 문구는 버튼이
 * 아니라 텍스트다. 눌러도 아무 일이 없는 것이 지금은 정상이다.
 */
export function CollectionSheet({ onClose }: { onClose: () => void }) {
  const { coins, badgeProgress, trophyProgress } = useStudy();

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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">내 컬렉션</h2>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-lemon px-3 py-1.5 text-base font-bold text-foreground">
              <Coins size={16} className="text-muted-foreground" />
              {coins}
            </span>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 목록이 길어 시트 안쪽만 스크롤한다. 바깥은 그대로 고정. */}
        <div className="max-h-[62vh] space-y-6 overflow-y-auto pb-1">
          <section>
            <h3 className="mb-3 text-lg font-extrabold text-foreground">트로피</h3>
            <ul className="space-y-3">
              {trophyProgress.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-4 rounded-[18px] bg-surface px-4 py-4"
                >
                  <div className={t.owned ? "" : "opacity-40 grayscale"}>
                    <Trophy id={t.id} size={56} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-foreground">{t.name}</p>
                    {t.owned ? null : (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {t.blockedBy !== null
                          ? `${t.blockedBy} 먼저`
                          : t.affordable
                            ? `구매하기 · ${t.price}코인`
                            : "코인 부족"}
                      </p>
                    )}
                  </div>
                  {t.owned ? (
                    <span className="shrink-0 text-sm font-bold text-purple">획득!</span>
                  ) : (
                    <span className="shrink-0 text-sm text-muted-foreground">
                      구매하기 · {t.price}코인
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-extrabold text-foreground">배지</h3>
            <ul className="space-y-3">
              {badgeProgress.map((b) => (
                <li
                  key={b.code}
                  className={`flex items-center gap-4 rounded-[18px] px-4 py-4 ${
                    b.earned ? "bg-lilac" : "bg-surface"
                  }`}
                >
                  <Badge code={b.code} earned={b.earned} size={56} />
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                    <p className="text-base font-bold text-foreground">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.requirement}</p>
                  </div>
                  {b.earned ? (
                    <span className="shrink-0 text-sm font-bold text-purple">획득!</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
