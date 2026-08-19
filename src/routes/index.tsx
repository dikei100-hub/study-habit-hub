import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check } from "lucide-react";
import { Card, MascotSlot, Screen } from "@/components/app/Screen";
import { useStudy } from "@/state/StudyStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "공부체크 — 오늘의 공부 습관" },
      { name: "description", content: "고등학생을 위한 공부 습관 체크앱. 오늘의 할 일과 달성률을 한눈에 확인하세요." },
      { property: "og:title", content: "공부체크 — 오늘의 공부 습관" },
      { property: "og:description", content: "오늘의 할 일과 달성률을 한눈에 확인하는 공부 습관 앱." },
    ],
  }),
  component: TodayScreen,
});

const taskTones = ["bg-task-green", "bg-task-sky", "bg-task-peach"];

function TodayScreen() {
  const { today, tasksFor, statsFor, toggleTodo, streak } = useStudy();
  const tasks = tasksFor(today) ?? [];
  const { done, rate } = statsFor(today);

  return (
    <Screen>
      <section className="mb-6 flex items-center gap-4">
        <MascotSlot />
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {rate === 100 ? "오늘 목표 달성! 🎉" : "오늘도 화이팅!"}
          </h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            {rate === 100
              ? "정말 최고예요, 오늘 하루 수고했어요 💜"
              : "조금씩 해내는 하루가 쌓여요 💜"}
          </p>
        </div>
      </section>

      <Card tone="lilac" className="mb-7">
        <div className="flex items-end justify-between">
          <span className="text-lg font-semibold text-foreground">오늘 목표 달성률</span>
          <span className="text-4xl font-extrabold text-foreground">{rate}%</span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-lemon transition-all duration-300"
            style={{ width: `${rate}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {done} / {tasks.length} 완료
          </span>
          <span>
            🔥 {streak.current}일 연속 달성 중 · 최고 {streak.best}일
          </span>
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-foreground">오늘의 할 일</h2>
        <button
          type="button"
          className="flex items-center gap-1.5 text-base font-semibold text-foreground"
        >
          <CalendarDays size={18} />
          리스트 관리
        </button>
      </div>

      <ul className="space-y-3">
        {tasks.map((task, i) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => toggleTodo(today, task.id)}
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
