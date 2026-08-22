/**
 * 개발용 가짜 데이터. 통계·캘린더 화면을 만들 때 빈 화면이면 확인이
 * 어려워서 둔다. `DEV_SEED` 는 **항상 `false` 로 커밋한다.** 켠 채로
 * 내보내면 실사용자에게 가짜 기록이 보인다.
 */
import { calendarMonth, monthRecords, todayTasks, type Task } from "@/mockData";
import { addDays, getStudyDate } from "@/lib/studyDay";
import { createSeedTemplates, todoIdFor, type TodosByDate } from "@/lib/seed";

export const DEV_SEED = false;

const titles = [
  "영어 단어 30개 외우기",
  "수학 문제집 2장 풀기",
  "복습 노트 정리하기",
  "국어 지문 3개 읽기",
];

/** 달성률에 맞는 할 일 목록을 만든다 (가짜 데이터 전용). */
function tasksForRate(dateKey: string, rate: number): Task[] {
  const total = rate === 75 ? 4 : 3;
  const done = Math.round((rate / 100) * total);
  return Array.from({ length: total }, (_, i) => ({
    id: `${dateKey}-${i + 1}`,
    title: titles[i % titles.length]!,
    done: i < done,
  }));
}

export function createDevSeedTodos(): TodosByDate {
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
