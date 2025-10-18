import { useMemo } from "react";
import { Card, Label, SectionTitle } from "./Field";
import { ExerciseBlockCard } from "./ExerciseBlockCard";
import type { ExerciseBlock, Session } from "../types";

function uid() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
}

export function SessionForm({
  value,
  onChange,
  onSave,
}: {
  value: Session;
  onChange: (s: Session) => void;
  onSave: () => void;
}) {
  function addExercise() {
    const block: ExerciseBlock = { id: uid(), name: "", variant: "", note: "", sets: [] };
    onChange({ ...value, exercises: [...value.exercises, block] });
  }
  function removeExercise(id: string) {
    onChange({ ...value, exercises: value.exercises.filter((b) => b.id !== id) });
  }
  function updateExercise(id: string, next: ExerciseBlock) {
    onChange({ ...value, exercises: value.exercises.map((b) => (b.id === id ? next : b)) });
  }

  const { sessionVolume, sessionRPE } = useMemo(() => {
    let vol = 0;
    let rpeSum = 0;
    for (const ex of value.exercises) {
      for (const s of ex.sets) {
        const sc = typeof s.setsCount === "number" ? s.setsCount : 1;
        if (typeof s.weightKg === "number" && typeof s.reps === "number") {
          vol += s.weightKg * s.reps * sc;
        }
        if (typeof s.rpe === "number") {
          rpeSum += s.rpe * sc;
        }
      }
    }
    return { sessionVolume: vol, sessionRPE: rpeSum };
  }, [value]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Card>
        <SectionTitle>セッション情報</SectionTitle>

        {/* タイトル */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4">
            <Label>タイトル</Label>
            <input
              type="text"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="例）上半身プレス / 下半身デー / スプリント など"
              value={value.title ?? ""}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
            />
          </div>

          {/* 日付・時間・体重 */}
          <div>
            <Label>日付</Label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={value.date}
              onChange={(e) => onChange({ ...value, date: e.target.value })}
            />
          </div>
          <div>
            <Label>開始</Label>
            <input
              type="time"
              className="w-full rounded-xl border px-3 py-2"
              value={value.startTime ?? ""}
              onChange={(e) => onChange({ ...value, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label>終了</Label>
            <input
              type="time"
              className="w-full rounded-xl border px-3 py-2"
              value={value.endTime ?? ""}
              onChange={(e) => onChange({ ...value, endTime: e.target.value })}
            />
          </div>
          <div>
            <Label>体重(kg)</Label>
            <input
              type="number"
              inputMode="decimal"
              className="w-full rounded-xl border px-3 py-2"
              value={value.bodyweightKg ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  bodyweightKg: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>

          {/* 感想・備考 */}
          <div className="md:col-span-4">
            <Label>感想・備考</Label>
            <textarea
              className="w-full rounded-xl border px-3 py-2"
              rows={3}
              placeholder="例：体調、フォームの気づき、ダッシュ/パワーマックスの詳細など"
              value={value.notes ?? ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* 種目 */}
      <div className="space-y-4">
        {value.exercises.map((b) => (
          <ExerciseBlockCard
            key={b.id}
            value={b}
            onChange={(next) => updateExercise(b.id, next)}
            onRemove={() => removeExercise(b.id)}
          />
        ))}
        <button type="button" onClick={addExercise} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
          ＋ 種目を追加
        </button>
      </div>

      {/* 合計 */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 flex gap-4">
            <span>
              セッション合計ボリューム: <span className="font-semibold">{sessionVolume} kg</span>
            </span>
            <span>
              RPE: <span className="font-semibold">{sessionRPE || 0}</span>
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <button type="submit" className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90">
              保存
            </button>
            <button
              type="button"
              onClick={() => onChange(initialSession())}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            >
              クリア
            </button>
          </div>
        </div>
      </Card>
    </form>
  );
}

export function initialSession(): Session {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return {
    id:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string,
    title: "",
    date: `${yyyy}-${mm}-${dd}`,
    bodyweightKg: 85, // 既定体重
    notes: "",
    exercises: [],
  };
}
