import { createFileRoute } from "@tanstack/react-router";
import { Card, MascotSlot, Screen } from "@/components/app/Screen";
import { Ring } from "@/components/app/Ring";
import { monthSummary, weekSummary } from "@/mockData";
import { useStudy } from "@/state/StudyStore";
import { shortLabel } from "@/lib/studyDay";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "통계 — 공부체크" },
      { name: "description", content: "최근 7일, 이번 주, 이번 달 공부 달성률을 확인해요." },
      { property: "og:title", content: "통계 — 공부체크" },
      { property: "og:description", content: "연속 달성과 주간·월간 달성률을 한눈에." },
    ],
  }),
  component: StatsScreen,
});

function StatsScreen() {
  const { last7Days, weekStats, monthStats, streak } = useStudy();
  return (
    <Screen>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card tone="sky" className="flex flex-col justify-between">
          <span className="text-lg font-bold text-foreground">연속 달성</span>
          <span className="mt-6 text-3xl font-extrabold text-foreground">
            {streak.current}일 🔥
          </span>
        </Card>
        <Card tone="lilac" className="flex flex-col items-center gap-3">
          <span className="text-base font-bold text-foreground">꾸준함이 힘이에요!</span>
          <MascotSlot size={84} />
        </Card>
      </div>

      <Card tone="lilac" className="mb-4">
        <h2 className="text-xl font-extrabold text-foreground">최근 7일 달성률</h2>
        <div className="mt-5 flex items-end justify-between gap-2">
          {last7Days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center">
              <div className="flex h-32 w-full items-end justify-center">
                {d.rate > 0 && (
                  <div
                    className="w-4 rounded-full bg-purple"
                    style={{ height: `${Math.max(d.rate, 8)}%` }}
                  />
                )}
              </div>
              <span className="mt-2 text-xs text-muted-foreground">{d.rate}%</span>
              <span className="mt-1 text-xs text-muted-foreground">{shortLabel(d.date)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card tone="sky" className="flex flex-col items-center text-center">
          <span className="text-lg font-extrabold text-foreground">이번 주 달성률</span>
          <span className="mt-1 text-sm font-bold text-up">▲ 이전 7일보다 {weekSummary.diff}%</span>
          <Ring rate={weekStats.rate} size={110} className="mt-4" />
          <span className="mt-3 text-sm text-muted-foreground">
            총 {weekStats.done} / {weekStats.total} 완료
          </span>
        </Card>
        <Card tone="lemon" className="flex flex-col items-center text-center">
          <span className="text-lg font-extrabold text-foreground">{monthSummary.label}</span>
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