import { calendarMonth, monthRecords, todayTasks, type Task } from "@/mockData";
import { getStudyDate, makeDateKey } from "@/lib/studyDay";

export type TodosByDate = Record<string, Task[]>;

const titles = [
  "영어 단어 30개 외우기",
  "수학 문제집 2장 풀기",
  "복습 노트 정리하기",
  "국어 지문 3개 읽기",
];

/** 달성률에 맞는 할 일 목록을 만든다 (mock 초기값 전용). */
function tasksForRate(dateKey: string, rate: number): Task[] {
  const total = rate === 75 ? 4 : 3;
  const done = Math.round((rate / 100) * total);
  return Array.from({ length: total }, (_, i) => ({
    id: `${dateKey}-${i + 1}`,
    title: titles[i % titles.length]!,
    done: i < done,
  }));
}

export function createSeedTodos(): TodosByDate {
  const todos: TodosByDate = {};
  for (const [day, rate] of Object.entries(monthRecords)) {
    const key = makeDateKey(calendarMonth.year, calendarMonth.month, Number(day));
    todos[key] = tasksForRate(key, rate);
  }

  const seededToday = makeDateKey(calendarMonth.year, calendarMonth.month, calendarMonth.today);
  const realToday = getStudyDate(new Date());
  const base = todayTasks.map((t) => ({ ...t }));
  todos[seededToday] = base;
  todos[realToday] = base.map((t) => ({ ...t, id: `${realToday}-${t.id}` }));
  return todos;
}
