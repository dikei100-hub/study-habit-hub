/** 하루 경계는 자정이 아니라 새벽 4시. 이 계산은 이 파일에만 둔다. */
const DAY_START_HOUR = 4;

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 주어진 시각이 속한 "공부 날짜"를 "YYYY-MM-DD"로 반환. */
export function getStudyDate(date: Date): string {
  const shifted = new Date(date.getTime());
  shifted.setHours(shifted.getHours() - DAY_START_HOUR);
  return toKey(shifted);
}

/** "YYYY-MM-DD" 만들기 (연/월/일 숫자에서). */
export function makeDateKey(year: number, month: number, day: number): string {
  return toKey(new Date(year, month - 1, day));
}

/** 날짜 키를 로컬 Date(정오)로 변환. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

/** 날짜 키에 일수 더하기. */
export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** 해당 날짜가 속한 주(일요일 시작)의 날짜 키 7개. */
export function weekKeys(key: string): string[] {
  const d = parseDateKey(key);
  const start = addDays(key, -d.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 해당 날짜가 속한 달의 모든 날짜 키. */
export function monthKeys(key: string): string[] {
  const d = parseDateKey(key);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => makeDateKey(year, month, i + 1));
}

/** "8/19" 같은 짧은 라벨. */
export function shortLabel(key: string): string {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
