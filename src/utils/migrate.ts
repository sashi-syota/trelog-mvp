// File: src/utils/migrate.ts
import type { Session, Template } from "../types";

export type AnyBackup = {
  __type?: string;
  version?: number;
  sessions?: unknown;
  templates?: unknown;
};

// スキーマ変換関数（将来の拡張用）
export function migrateBackup(raw: AnyBackup) {
  let version = raw.version ?? 0;
  let sessions: Session[] = [];
  let templates: Template[] = [];

  // --- v0 → v1 移行例 ---
  if (version === 0) {
    const arr = Array.isArray(raw.sessions) ? raw.sessions : [];
    sessions = arr.map((s: any) => ({
      id: s.id ?? crypto.randomUUID(),
      date: s.date ?? "",
      title: s.title ?? "",
      notes: s.notes ?? "",
      exercises: (s.exercises ?? []).map((ex: any) => ({
        id: ex.id ?? crypto.randomUUID(),
        name: ex.name ?? "",
        variant: ex.variant ?? "",
        note: ex.note ?? "",
        sets: (ex.sets ?? []).map((st: any, i: number) => ({
          id: st.id ?? crypto.randomUUID(),
          setNumber: st.setNumber ?? i + 1,
          weightKg: st.weightKg ?? "",
          reps: st.reps ?? "",
          durationSec: st.durationSec ?? "",
          setsCount: st.setsCount ?? 1,
          intervalSec: st.intervalSec ?? "",
          rpe: st.rpe ?? "",
          note: st.note ?? "",
        })),
      })),
    }));
    templates = Array.isArray(raw.templates)
      ? raw.templates.map((t: any) => ({
          id: t.id ?? crypto.randomUUID(),
          name: t.name ?? "",
          description: t.description ?? "",
          exercises: Array.isArray(t.exercises) ? t.exercises : [],
        }))
      : [];
    version = 1;
  }

  return { version, sessions, templates };
}
