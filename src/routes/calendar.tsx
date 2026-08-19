import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card, Screen } from "@/components/app/Screen";
import { calendarMonth, monthRecords, todayTasks } from "@/mockData";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "캘린더 — 공부체크" },
      { name: "description", content: "날짜별 공부 달성률을 달력으로 돌아봐요." },
      { property: "og:title", content: "캘린더 — 공부체크" },
      { property: "og:description", content: "날짜별 달성률과 그날의 할 일 기록." },
    ],
  }),
  component: CalendarScreen,
});

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const taskTones = ["bg-task-green", "bg-task-sky", "bg-task-peach"];

function DayRing({ rate }: { rate: number }) {
  const size = 34;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const empty = rate === 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        {!empty && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--purple-soft)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - rate / 100)}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
        {rate}%
      </span>
    </div>
  );
}

function CalendarScreen() {
  const { year, month, today } = calendarMonth;
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const doneCount = todayTasks.filter((t) => t.done).length;

  return (
    <Screen>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="이전 달" className="p-1 text-muted-foreground">
            <ChevronLeft size={22} />
          </button>
          <span className="text-lg font-extrabold text-foreground">
            {year}년 {month}월
          </span>
          <button type="button" aria-label="다음 달" className="p-1 text-muted-foreground">
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-y-3 text-center">
          {weekdays.map((w, i) => (
            <span
              key={w}
              className={`text-sm font-bold ${i === 0 ? "text-destructive" : i === 6 ? "text-purple" : "text-muted-foreground"}`}
            >
              {w}
            </span>
          ))}
          {cells.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              {day && (
                <>
                  <span
                    className={`text-sm ${day === today ? "text-base font-extrabold text-purple" : "text-foreground"}`}
                  >
                    {day}
                  </span>
                  {day in monthRecords ? (
                    <DayRing rate={monthRecords[day]!} />
                  ) : (
                    <span className="flex h-[34px] items-center text-sm text-muted-foreground">
                      -
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-foreground">8월 19일 (수)</h2>
        <div className="flex items-center gap-3">
          <button type="button" className="text-base font-semibold text-foreground">
            리스트 관리
          </button>
          <span className="text-sm text-muted-foreground">
            {doneCount} / {todayTasks.length} 완료
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {todayTasks.map((task, i) => (
          <li
            key={task.id}
            className={`flex items-center gap-4 rounded-[20px] px-4 py-4 shadow-soft ${taskTones[i % taskTones.length]}`}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-md ${task.done ? "bg-check" : "bg-surface"}`}
            >
              {task.done && <Check size={18} strokeWidth={3} className="text-surface" />}
            </span>
            <span className="flex-1 text-lg font-semibold text-foreground">{task.title}</span>
            <span className="text-sm font-bold text-muted-foreground">
              {task.done ? "완료" : "진행 중"}
            </span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}