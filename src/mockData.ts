export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export const todayTasks: Task[] = [
  { id: "t1", title: "영어 단어 30개 외우기", done: true },
  { id: "t2", title: "수학 문제집 2장 풀기", done: true },
  { id: "t3", title: "복습 노트 정리하기", done: false },
];

export const streak = { current: 1, best: 4 };

export const last7Days = [
  { label: "8/13", rate: 100 },
  { label: "8/14", rate: 100 },
  { label: "8/15", rate: 100 },
  { label: "8/16", rate: 0 },
  { label: "8/17", rate: 0 },
  { label: "8/18", rate: 0 },
  { label: "8/19", rate: 100 },
];

export const weekSummary = {
  rate: 100,
  diff: 73,
  done: 12,
  total: 12,
};

export const monthSummary = {
  rate: 55,
  done: 20,
  total: 36,
  label: "8월 달성률",
};

/** 날짜(일) -> 달성률. 값이 없으면 기록 없는 날. */
export const monthRecords: Record<number, number> = {
  2: 75,
  3: 66,
  4: 0,
  5: 0,
  7: 0,
  11: 0,
  12: 100,
  13: 100,
  14: 100,
  15: 100,
  19: 100,
};

export const calendarMonth = { year: 2026, month: 8, today: 19 };

export const badges = [
  { id: "b1", name: "첫걸음" },
  { id: "b2", name: "첫 연속" },
];

export const trophies: { id: string; name: string }[] = [];