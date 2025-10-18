export type RPE = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type SetEntry = {
  id: string;
  setNumber: number;
  weightKg: number | "";       // 重量
  durationSec: number | "";    // 実施時間（秒）
  reps: number | "";           // レップ
  setsCount: number | "";      // 同一内容のセット数（この行が何セット相当か）
  rpe: RPE | "";               // RPE
  intervalSec: number | "";    // レスト（秒）
  note?: string;               // セットメモ
};

export type ExerciseBlock = {
  id: string;
  name: string;
  variant?: string;
  note?: string;               // 種目メモ
  sets: SetEntry[];
};

export type Session = {
  id: string;
  title?: string;
  date: string;              // yyyy-mm-dd
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  bodyweightKg?: number | "";
  notes?: string;            // セッション全体の感想・備考
  exercises: ExerciseBlock[];
};


/** 🧩 テンプレート：日付や体重は含めず、種目構成とメモだけを保存 */
export type Template = {
  id: string;
  name: string;                 // テンプレ表示名
  notes?: string;               // セッション全体メモの雛形（任意）
  exercises: ExerciseBlock[];   // 種目・セットの雛形
};
