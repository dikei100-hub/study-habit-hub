import { calendarMonth, monthRecords, todayTasks, type Task } from "@/mockData";
import { addDays, getStudyDate } from "@/lib/studyDay";

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
  const today = getStudyDate(new Date());
  const templates = createSeedTemplates();
  const todos: TodosByDate = {};

  // monthRecords 의 키는 calendarMonth.today 기준 상대 위치로 읽는다.
  // 고정 날짜가 아니라 오늘에서 같은 간격만큼 떨어진 날에 기록을 깐다.
  for (const [day, rate] of Object.entries(monthRecords)) {
    const key = addDays(today, Number(day) - calendarMonth.today);
    todos[key] = tasksForRate(key, rate);
  }

  // 오늘 할 일은 템플릿에서 깔린 것으로 취급한다. 리스트 관리 시트가
  // `${날짜}-${템플릿id}` 로 항목을 찾으므로(todoIdFor), 시드도 같은 형식이어야
  // 체크 해제·휴지통이 오늘 할 일에 반영된다. (CoreRules 2·3장)
  todos[today] = todayTasks.map((task, i) => {
    const tpl = templates.find((t) => t.title === task.title);
    return { ...task, id: tpl ? todoIdFor(today, tpl.id) : `${today}-seed-${i + 1}` };
  });

  return todos;
}

export function createSeedTemplates(): TemplateItem[] {
  return ["영어 단어 30개 외우기", "수학 문제집 2장 풀기", "복습 노트 정리하기"].map(
    (title, i) => ({ id: `tpl-${i + 1}`, title, sortOrder: i }),
  );
}

/** 대상 날짜에 할 일이 하나도 없으면 목록의 모든 항목을 미완료로 복사한다. */
export function fillFromTemplate(
  todos: TodosByDate,
  date: string,
  templates: TemplateItem[],
): TodosByDate {
  // 묻는 것은 "이 날짜를 만든 적이 있나" 이므로 길이가 아니라 키 존재로 본다.
  // 사용자가 항목을 전부 지운 빈 배열도 만든 적이 있는 것이라 다시 깔지 않는다.
  // statsFor 는 "화면에 보여줄 기록이 있나" 라는 다른 질문이라 기준이 다르다.
  // 두 기준을 통일하지 말 것.
  if (date in todos) return todos;
  // filter 가 사라져 원본 배열이 그대로 들어오므로 복사한 뒤 정렬한다.
  const sorted = [...templates].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) return todos;
  return {
    ...todos,
    [date]: sorted.map((t) => ({ id: `${date}-${t.id}`, title: t.title, done: false })),
  };
}

export function todoIdFor(date: string, templateId: string): string {
  return `${date}-${templateId}`;
}
