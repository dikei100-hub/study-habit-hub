import { useState } from "react";
import { X } from "lucide-react";
import { clearState } from "@/lib/storage";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);

  // 지우고 나서 상태를 손으로 되돌리지 않는다. 리로드하면 loadState 가
  // 시드 상태를 새로 만든다.
  const reset = () => {
    clearState();
    window.location.reload();
  };

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
          <h2 className="text-xl font-extrabold text-foreground">설정</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <div className="rounded-[20px] bg-surface p-5 shadow-soft">
          <p className="text-lg font-extrabold text-foreground">데이터 초기화</p>
          <p className="mt-1 text-sm text-muted-foreground">
            할 일과 기록을 모두 지우고 처음 상태로 되돌려요.
          </p>

          {confirming ? (
            <>
              <p className="mt-4 text-base font-semibold text-foreground">
                정말 지울까요? 되돌릴 수 없어요.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-[20px] bg-blush px-4 py-3 text-base font-bold text-foreground"
                >
                  네, 지울게요
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-[20px] bg-muted px-4 py-3 text-base font-bold text-muted-foreground"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 rounded-[20px] bg-blush px-5 py-3 text-base font-bold text-foreground"
            >
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
