// File: src/pages/RecordPage.tsx
import { useEffect, useMemo, useState } from "react";
import { SessionForm, initialSession } from "../components/SessionForm";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { ExerciseBlock, Session, Template } from "../types";
import { useNavigate } from "react-router-dom";
import { Card, Label, SectionTitle } from "../components/Field";

function uid() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
}

// 雛形から現在セッションへコピーする際に、新しいIDと連番を振り直す
function cloneExerciseBlock(b: ExerciseBlock, indexOffset = 0): ExerciseBlock {
  return {
    id: uid(),
    name: b.name,
    variant: b.variant,
    note: b.note,
    sets: (b.sets ?? []).map((s, i) => ({
      id: uid(),
      setNumber: i + 1 + indexOffset,
      weightKg: s.weightKg,
      reps: s.reps,
      rpe: s.rpe,
      intervalSec: s.intervalSec,
      note: s.note ?? "",
    })),
  };
}

export default function RecordPage() {
  const [current, setCurrent] = useLocalStorage<Session>("trelog/session/current", initialSession());
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const [templates, setTemplates] = useLocalStorage<Template[]>("trelog/templates/v1", []);
  const [tplName, setTplName] = useState("");

  const navigate = useNavigate();

  // 保存可否：数値セット or 何かしら意味のある入力があればOK（ダッシュ/パワマ対応）
  function canSave(s: Session) {
    const hasNumericSet = s.exercises.some((ex) =>
      ex.sets.some((st) => typeof st.weightKg === "number" || typeof st.reps === "number")
    );
    const hasMeaning =
      (s.title && s.title.trim() !== "") ||
      (s.notes && s.notes.trim() !== "") ||
      s.exercises.some(
        (ex) =>
          (ex.name && ex.name.trim() !== "") ||
          (ex.variant && ex.variant.trim() !== "") ||
          (ex.note && ex.note.trim() !== "") ||
          ex.sets.length > 0
      );
    return hasNumericSet || hasMeaning;
  }

  function handleSave() {
    if (!canSave(current)) {
      alert("タイトルや感想・備考、種目名/バリアント/種目メモ、あるいはセットのいずれかを入力してください。");
      return;
    }
    const title = (current.title ?? "").trim() || "無題セッション";
    const saved: Session = { ...current, title };
    setHistory([saved, ...history]);
    setCurrent(initialSession());
    navigate("/logs"); // 保存後は一覧へ
  }

  // Cmd/Ctrl + S で保存
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, history]);

  // ===== テンプレ =====

  // 現在の入力からテンプレ作成
  function saveAsTemplate() {
    const name = tplName.trim() || current.title?.trim() || "無題テンプレート";
    // 何もないテンプレは避ける
    const hasAnything =
      (current.notes && current.notes.trim() !== "") ||
      current.exercises.length > 0 ||
      (current.title && current.title.trim() !== "");
    if (!hasAnything) {
      alert("テンプレートに保存できる内容がありません。種目や感想・備考などを入力してください。");
      return;
    }

    // 種目は深いコピーでID振り直し
    const clonedExercises = current.exercises.map((ex) => cloneExerciseBlock(ex));
    const tpl: Template = {
      id: uid(),
      name,
      notes: current.notes ?? "",
      exercises: clonedExercises,
    };
    setTemplates([tpl, ...templates]);
    setTplName("");
    alert(`テンプレート「${name}」を保存しました。`);
  }

  // テンプレ適用（現在の内容に上書き or 追記）
  function applyTemplate(tpl: Template, mode: "replace" | "append") {
    if (mode === "replace") {
      const cloned = tpl.exercises.map((ex) => cloneExerciseBlock(ex));
      setCurrent({
        ...current,
        title: current.title?.trim() ? current.title : tpl.name, // タイトルが空ならテンプレ名をセット
        notes: current.notes?.trim() ? current.notes : tpl.notes, // 感想・備考も空ならテンプレから
        exercises: cloned,
      });
    } else {
      // append: 既存末尾に追加
      const offset = current.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
      const appended = tpl.exercises.map((ex) => cloneExerciseBlock(ex, 0));
      setCurrent({
        ...current,
        exercises: [...current.exercises, ...appended],
      });
    }
  }

  function deleteTemplate(id: string) {
    if (!confirm("このテンプレートを削除しますか？")) return;
    setTemplates(templates.filter((t) => t.id !== id));
  }

  // 表示用：テンプレの簡易メタ
  const tplMeta = useMemo(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        exCount: t.exercises.length,
        setCount: t.exercises.reduce((a, ex) => a + ex.sets.length, 0),
      })),
    [templates]
  );

  return (
    <section className="space-y-6">
      {/* ===== テンプレート管理バー ===== */}
      <Card>
        <SectionTitle>テンプレート</SectionTitle>

        {/* 作成 */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>テンプレート名</Label>
            <input
              type="text"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="例）上半身プレス（基本） / 柔道 立技補強 / スプリント日 など"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-xl border px-3 py-2 hover:bg-gray-50"
              onClick={saveAsTemplate}
              title="現在の入力内容をテンプレートとして保存"
            >
              現在の内容をテンプレ保存
            </button>
          </div>
        </div>

        {/* 一覧＆適用 */}
        <div className="mt-4">
          {tplMeta.length === 0 ? (
            <p className="text-sm text-gray-600">
              まだテンプレートがありません。上のボタンで作成できます。
            </p>
          ) : (
            <ul className="space-y-2">
              {tplMeta.map((t) => (
                <li key={t.id} className="rounded-xl border px-3 py-2 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-600">
                      種目 {t.exCount} / セット {t.setCount}
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                        onClick={() => applyTemplate(templates.find((x) => x.id === t.id)!, "replace")}
                        title="現在の内容をこのテンプレで置き換え"
                      >
                        適用（置換）
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                        onClick={() => applyTemplate(templates.find((x) => x.id === t.id)!, "append")}
                        title="現在の内容の末尾にこのテンプレを追加"
                      >
                        追加
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* ===== 入力フォーム（保存ボタンはRecordPage側のhandleSaveに委譲） ===== */}
      <SessionForm value={current} onChange={setCurrent} onSave={handleSave} />
    </section>
  );
}
