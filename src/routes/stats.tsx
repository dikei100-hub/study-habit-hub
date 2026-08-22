import { createFileRoute } from "@tanstack/react-router";
import { Card, Mascot, Screen } from "@/components/app/Screen";
import { Ring } from "@/components/app/Ring";
import { useStudy } from "@/state/StudyStore";
import { shortLabel } from "@/lib/studyDay";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "통계 — 공부체크" },
      { name: "description", content: "최근 7일, 이번 주, 이번 달 공부 달성률을 확인해요." },
      { property: "og:title", content: "통계 — 공부체크" },
      { property: "og:description", content: "연속 공부와 주간·월간 달성률을 한눈에." },
    ],
  }),
  component: StatsScreen,
});

/**
 * 막대 한 칸. **세 갈래**로 그린다.
 *
 * 기록이 없는 날(앱을 안 연 날)과 담았는데 하나도 못 한 날은 다른 상태다.
 * `d.rate > 0` 만 보면 둘이 똑같이 빈 자리로 보여, 캘린더가 `-` 와 `0%` 로
 * 가르는 것과 두 화면의 답이 어긋난다.
 *
 * 0% 막대는 바닥에 붙은 얇은 선이다. 높이를 아주 낮게 두고 흐린 색을 써서
 * 1% 이상과 헷갈리지 않게 한다 — "담았는데 아직 못 했다" 가 읽히면 된다.
 */
function DayBar({ rate, hasRecord }: { rate: number; hasRecord: boolean }) {
  return (
    <div className="flex h-32 w-full items-end justify-center">
      {rate > 0 ? (
        <div className="w-4 rounded-full bg-purple" style={{ height: `${Math.max(rate, 8)}%` }} />
      ) : hasRecord ? (
        <div className="h-1 w-4 rounded-full bg-purple-soft" />
      ) : null}
    </div>
  );
}

function StatsScreen() {
  const { last7Days, weekStats, weekDiff, monthStats, monthLabel, streak } = useStudy();
  const diffText = {
    up: `▲ 지난주보다 ${weekDiff.value}%`,
    down: `▼ 지난주보다 ${weekDiff.value}%`,
    same: "지난주와 같아요",
    none: "지난주 기록이 없어요",
  }[weekDiff.kind];
  const diffTone = {
    up: "text-up",
    down: "text-down",
    same: "text-muted-foreground",
    none: "text-muted-foreground",
  }[weekDiff.kind];
  return (
    <Screen>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card tone="sky" className="flex flex-col justify-between">
          <span className="text-lg font-bold text-foreground">연속 공부</span>
          <span className="mt-6 text-3xl font-extrabold text-foreground">
            {streak.current}일 🔥
          </span>
        </Card>
        <Card tone="lilac" className="flex flex-col items-center gap-3">
          <span className="text-base font-bold text-foreground">꾸준함이 힘이에요!</span>
          <Mascot kind="graduate" size={84} />
        </Card>
      </div>

      <Card tone="lilac" className="mb-4">
        <h2 className="text-xl font-extrabold text-foreground">최근 7일 달성률</h2>
        <div className="mt-5 flex items-end justify-between gap-2">
          {last7Days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center">
              <DayBar rate={d.rate} hasRecord={d.hasRecord} />
              <span className="mt-2 text-xs text-muted-foreground">{d.rate}%</span>
              <span className="mt-1 text-xs text-muted-foreground">{shortLabel(d.date)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card tone="sky" className="flex flex-col items-center text-center">
          <span className="text-lg font-extrabold text-foreground">이번 주 달성률</span>
          <span className={`mt-1 text-sm font-bold ${diffTone}`}>{diffText}</span>
          <Ring rate={weekStats.rate} size={110} className="mt-4" />
          <span className="mt-3 text-sm text-muted-foreground">
            총 {weekStats.done} / {weekStats.total} 완료
          </span>
        </Card>
        <Card tone="lemon" className="flex flex-col items-center text-center">
          <span className="text-lg font-extrabold text-foreground">{monthLabel}</span>
          <span className="mt-1 text-sm text-muted-foreground">매달 새롭게 시작해요</span>
          <Ring rate={monthStats.rate} size={110} className="mt-4" />
          <span className="mt-3 text-sm text-muted-foreground">
            총 {monthStats.done} / {monthStats.total} 완료
          </span>
        </Card>
      </div>
    </Screen>
  );
}