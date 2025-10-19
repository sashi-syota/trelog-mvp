// src/utils/validateBackup.ts
import type { Session, Template } from "../types";
import { migrateBackup } from "./migrate";

export type ImportAnalyze = {
  sessions: Session[];
  templates: Template[];
  counts: { sessions: number; templates: number };
  dateRange: { min: string | null; max: string | null };
  warnings: string[];
};

export function analyzeImportJson(raw: unknown): ImportAnalyze {
  const { sessions, templates } = migrateBackup(raw);

  // 型ゆるチェック
  const safeSessions = (sessions ?? []).filter(
    (s: any) => typeof s?.id === "string" && typeof s?.date === "string"
  );
  const safeTemplates = (templates ?? []).filter(
    (t: any) => typeof t?.id === "string" && typeof t?.name === "string"
  );

  const warnings: string[] = [];
  if (safeSessions.length !== (sessions?.length ?? 0)) warnings.push("一部のセッションは形式不正で除外されます。");
  if (safeTemplates.length !== (templates?.length ?? 0)) warnings.push("一部のテンプレートは形式不正で除外されます。");

  const dates = safeSessions.map(s => s.date).filter(Boolean).sort();
  const range = { min: dates[0] ?? null, max: dates[dates.length - 1] ?? null };

  return {
    sessions: safeSessions,
    templates: safeTemplates,
    counts: { sessions: safeSessions.length, templates: safeTemplates.length },
    dateRange: range,
    warnings,
  };
}
