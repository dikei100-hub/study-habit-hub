import type { Task } from "@/mockData";
import { getStudyDate } from "@/lib/studyDay";
// devSeed 는 이 파일의 createSeedTemplates·todoIdFor 를 쓰므로 순환 import 다.
// 양쪽 다 최상위에서 상대 바인딩을 읽지 않고 함수 안에서만 호출하므로 ESM 에서
// 안전하다. 최상위에서 쓰기 시작하면 깨지니 그러지 말 것.
import { DEV_SEED, createDevSeedTodos } from "@/lib/devSeed";

export type TodosByDate = Record<string, Task[]>;
export type TemplateItem = { id: string; title: string; sortOrder: number };

/**
 * 저장된 값이 없을 때의 첫 상태. 과거 기록은 만들지 않는다.
 * 오늘 목록을 손으로 만들지 않고 새 날 채우기와 같은 함수를 지나게 해서
 * id 형식·정렬·미완료 상태가 어긋날 수 없게 한다. (CoreRules 5장)
 */
export function createSeedTodos(): TodosByDate {
  if (DEV_SEED) return createDevSeedTodos();
  const today = getStudyDate(new Date());
  return fillFromTemplate({}, today, createSeedTemplates());
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
