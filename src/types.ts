export type RPE = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type SetEntry = {
  id: string;
  setNumber: number;
  weightKg: number | "";
  reps: number | "";
  rpe: RPE | "";
  intervalSec: number | "";
  note?: string;
};

export type ExerciseBlock = {
  id: string;
  name: string;
  variant?: string;
  /** 種目全体のメモ（ダッシュ系の詳細や補足など） */
  note?: string;
  sets: SetEntry[];
};

export type Session = {
  id: string;
  title?: string;
  date: string;              // yyyy-mm-dd
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  bodyweightKg?: number | "";
  /** セッション全体の感想・備考 */
  notes?: string;
  exercises: ExerciseBlock[];
};

/** 🧩 テンプレート：日付や体重は含めず、種目構成とメモだけを保存 */
export type Template = {
  id: string;
  name: string;                 // テンプレ表示名
  notes?: string;               // セッション全体メモの雛形（任意）
  exercises: ExerciseBlock[];   // 種目・セットの雛形
};
