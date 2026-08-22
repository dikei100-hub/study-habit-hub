import type { Task } from "@/mockData";
// devSeed 는 이 파일의 createSeedTemplates·todoIdFor 를 쓰므로 순환 import 다.
// 양쪽 다 최상위에서 상대 바인딩을 읽지 않고 함수 안에서만 호출하므로 ESM 에서
// 안전하다. 최상위에서 쓰기 시작하면 깨지니 그러지 말 것.
import { DEV_SEED, createDevSeedTodos } from "@/lib/devSeed";

export type TodosByDate = Record<string, Task[]>;
export type TemplateItem = { id: string; title: string; sortOrder: number };

/**
 * 저장된 값이 없을 때의 첫 상태. **할 일은 하나도 만들지 않는다.**
 * 오늘 것도 만들지 않는다 — 어떤 날짜도 자동으로 채우지 않는 것이 규칙이다
 * (CoreRules 5장). 리스트 관리에서 체크한 것만 그 날짜에 담긴다.
 * 명단(createSeedTemplates)은 있고 아무것도 체크되지 않은 상태로 시작한다.
 */
export function createSeedTodos(): TodosByDate {
  if (DEV_SEED) return createDevSeedTodos();
  return {};
}

export function createSeedTemplates(): TemplateItem[] {
  return ["영어 단어 30개 외우기", "수학 문제집 2장 풀기", "복습 노트 정리하기"].map(
    (title, i) => ({ id: `tpl-${i + 1}`, title, sortOrder: i }),
  );
}

export function todoIdFor(date: string, templateId: string): string {
  return `${date}-${templateId}`;
}
