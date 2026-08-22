import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { Card, Mascot, Screen, type MascotKind } from "@/components/app/Screen";
import { ListSheet } from "@/components/app/ListSheet";
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

/**
 * 달성률 3단계. 마스코트와 인사말이 **같은 판정 결과**를 쓴다.
 * 두 군데서 따로 rate 를 비교하면 나중에 경계를 바꿀 때 어긋난다.
 */
export const todayStages: { kind: MascotKind; title: string; sub: string }[] = [
  { kind: "hello", title: "오늘도 화이팅!", sub: "조금씩 해내는 하루가 쌓여요 💜" },
  { kind: "good", title: "잘하고 있어요!", sub: "이 기세로 끝까지 가봐요 💜" },
  {
    kind: "congrats",
    title: "오늘 목표 달성! 🎉",
    sub: "정말 최고예요, 오늘 하루 수고했어요 💜",
  },
];

/** 0% → 시작 전, 1~99% → 진행 중, 100% → 목표 달성. */
export const stageIndexFor = (rate: number): number => (rate === 100 ? 2 : rate > 0 ? 1 : 0);

function TodayScreen() {
  const { today, tasksFor, statsFor, toggleTodo, removeTodo, streak } = useStudy();
  const [sheetOpen, setSheetOpen] = useState(false);
  const tasks = tasksFor(today) ?? [];
  const { done, rate } = statsFor(today);
  const stage = todayStages[stageIndexFor(rate)]!;

  return (
    <Screen>
      <section className="mb-6 flex items-center gap-4">
        <Mascot kind={stage.kind} />
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{stage.title}</h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">{stage.sub}</p>
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
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 text-base font-semibold text-foreground"
        >
          <CalendarDays size={18} />
          리스트 관리
        </button>
      </div>

      <ul className="space-y-3">
        {tasks.map((task, i) => (
          <li key={task.id}>
            <div
              className={`flex w-full items-center gap-4 rounded-[20px] px-4 py-4 text-left shadow-soft ${taskTones[i % taskTones.length]}`}
            >
              <button
                type="button"
                aria-label={`${task.title} 완료 표시`}
                onClick={() => toggleTodo(today, task.id)}
                className={`flex size-7 items-center justify-center rounded-md ${task.done ? "bg-check" : "bg-surface"}`}
              >
                {task.done && <Check size={18} strokeWidth={3} className="text-surface" />}
              </button>
              <button
                type="button"
                onClick={() => toggleTodo(today, task.id)}
                className="flex-1 text-left text-lg font-semibold text-foreground"
              >
                {task.title}
              </button>
              <span className="text-sm font-bold text-muted-foreground">
                {task.done ? "완료" : "진행 중"}
              </span>
              <button
                type="button"
                aria-label={`${task.title} 삭제`}
                onClick={() => removeTodo(today, task.id)}
                className="p-1 text-muted-foreground"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {sheetOpen && <ListSheet date={today} onClose={() => setSheetOpen(false)} />}
    </Screen>
  );
}
