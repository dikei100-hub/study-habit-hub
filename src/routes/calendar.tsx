import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Trash2 } from "lucide-react";
import { Card, Screen } from "@/components/app/Screen";
import { ListSheet } from "@/components/app/ListSheet";
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
  const { today, tasksFor, statsFor, toggleTodo, removeTodo, ensureDate, canManage } = useStudy();
  const [sheetOpen, setSheetOpen] = useState(false);
  const todayDate = parseDateKey(today);
  const [view, setView] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth() + 1,
  });
  const { year, month } = view;
  const [selected, setSelected] = useState(today);

  /** delta 만큼 달을 옮기고, 그 달에 오늘이 있으면 오늘을, 없으면 1일을 고른다. */
  const shiftMonth = (delta: number) => {
    const m = view.month - 1 + delta;
    const next = { year: view.year + Math.floor(m / 12), month: (((m % 12) + 12) % 12) + 1 };
    const first = makeDateKey(next.year, next.month, 1);
    setView(next);
    setSelected(first.slice(0, 7) === today.slice(0, 7) ? today : first);
  };

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const selectedDate = parseDateKey(selected);
  const selectedTasks = tasksFor(selected) ?? [];
  const selectedStats = statsFor(selected);

  useEffect(() => {
    if (canManage(selected)) ensureDate(selected);
  }, [selected, ensureDate, canManage]);

  return (
    <Screen>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => shiftMonth(-1)}
            className="p-1 text-muted-foreground"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-lg font-extrabold text-foreground">
            {year}년 {month}월
          </span>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => shiftMonth(1)}
            className="p-1 text-muted-foreground"
          >
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
                      className={`text-sm ${key === today ? "text-base font-extrabold text-purple" : "text-foreground"}`}
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
          {canManage(selected) && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="text-base font-semibold text-foreground"
            >
              리스트 관리
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            {selectedStats.done} / {selectedStats.total} 완료
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {selectedTasks.map((task, i) => (
          <li key={task.id}>
            <div
              className={`flex w-full items-center gap-4 rounded-[20px] px-4 py-4 text-left shadow-soft ${taskTones[i % taskTones.length]}`}
            >
              <button
                type="button"
                aria-label={`${task.title} 완료 표시`}
                onClick={() => toggleTodo(selected, task.id)}
                className={`flex size-7 items-center justify-center rounded-md ${task.done ? "bg-check" : "bg-surface"}`}
              >
                {task.done && <Check size={18} strokeWidth={3} className="text-surface" />}
              </button>
              <button
                type="button"
                onClick={() => toggleTodo(selected, task.id)}
                className="flex-1 text-left text-lg font-semibold text-foreground"
              >
                {task.title}
              </button>
              <span className="text-sm font-bold text-muted-foreground">
                {task.done ? "완료" : "진행 중"}
              </span>
              {canManage(selected) && (
                <button
                  type="button"
                  aria-label={`${task.title} 삭제`}
                  onClick={() => removeTodo(selected, task.id)}
                  className="p-1 text-muted-foreground"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sheetOpen && <ListSheet date={selected} onClose={() => setSheetOpen(false)} />}
    </Screen>
  );
}