import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card, Screen } from "@/components/app/Screen";
import { useStudy } from "@/state/StudyStore";
import { makeDateKey, parseDateKey } from "@/lib/studyDay";

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
  const { today, tasksFor, statsFor, toggleTodo } = useStudy();
  const todayDate = parseDateKey(today);
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth() + 1;
  const todayDay = todayDate.getDate();
  const [selected, setSelected] = useState(today);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const selectedDate = parseDateKey(selected);
  const selectedTasks = tasksFor(selected) ?? [];
  const selectedStats = statsFor(selected);

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
          {cells.map((day, idx) => {
            const key = day ? makeDateKey(year, month, day) : null;
            const stats = key ? statsFor(key) : null;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                {day && key && (
                  <button
                    type="button"
                    onClick={() => setSelected(key)}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`text-sm ${day === todayDay ? "text-base font-extrabold text-purple" : "text-foreground"}`}
                    >
                      {day}
                    </span>
                    {stats?.hasRecord ? (
                      <DayRing rate={stats.rate} />
                    ) : (
                      <span className="flex h-[34px] items-center text-sm text-muted-foreground">
                        -
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-foreground">
          {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 (
          {weekdays[selectedDate.getDay()]})
        </h2>
        <div className="flex items-center gap-3">
          <button type="button" className="text-base font-semibold text-foreground">
            리스트 관리
          </button>
          <span className="text-sm text-muted-foreground">
            {selectedStats.done} / {selectedStats.total} 완료
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {selectedTasks.map((task, i) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => toggleTodo(selected, task.id)}
              className={`flex w-full items-center gap-4 rounded-[20px] px-4 py-4 text-left shadow-soft ${taskTones[i % taskTones.length]}`}
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
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  );
}