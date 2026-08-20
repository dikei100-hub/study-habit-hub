import { calendarMonth, monthRecords, todayTasks, type Task } from "@/mockData";
import { makeDateKey } from "@/lib/studyDay";

export type TodosByDate = Record<string, Task[]>;
export type TemplateItem = { id: string; title: string; sortOrder: number };

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
  todos[seededToday] = todayTasks.map((t) => ({ ...t }));
  return todos;
}

export function createSeedTemplates(): TemplateItem[] {
  return todayTasks.map((t, i) => ({
    id: `tpl-${i + 1}`,
    title: t.title,
    sortOrder: i,
  }));
}

/** 대상 날짜에 할 일이 하나도 없으면 템플릿 전체를 미완료로 복사한다. */
export function fillFromTemplate(
  todos: TodosByDate,
  date: string,
  templates: TemplateItem[],
): TodosByDate {
  const list = todos[date];
  if (list && list.length > 0) return todos;
  if (templates.length === 0) return todos;
  const sorted = [...templates].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...todos,
    [date]: sorted.map((t) => ({ id: `${date}-${t.id}`, title: t.title, done: false })),
  };
}
