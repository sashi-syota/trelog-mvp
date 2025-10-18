export type RPE = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type SetEntry = {
  id: string;
  setNumber: number;
  weightKg: number | "";
  reps: number | "";
  rpe?: RPE | "";
  intervalSec?: number | ""; // rest after the set
  note?: string;
};

export type ExerciseBlock = {
  id: string;
  name: string; // e.g., "Back Squat"
  variant?: string; // e.g., "Low-bar"
  sets: SetEntry[];
};

export type Session = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  bodyweightKg?: number | "";
  notes?: string;
  exercises: ExerciseBlock[];
};