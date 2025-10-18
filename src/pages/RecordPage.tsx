import { useEffect } from "react";
import { SessionForm, initialSession } from "../components/SessionForm";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Session } from "../types";
import { useNavigate } from "react-router-dom";

export default function RecordPage() {
  const [current, setCurrent] = useLocalStorage<Session>("trelog/session/current", initialSession());
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const navigate = useNavigate();

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
          ex.sets.length > 0
      );
    // いずれか満たせば保存可能（ダッシュ系・パワーマックス対応）
    return hasNumericSet || hasMeaning;
  }

  function handleSave() {
    if (!canSave(current)) {
      alert("タイトルやメモ、種目名/バリアント、あるいはセットのいずれかを入力してください。");
      return;
    }
    const title = current.title?.trim() || "無題セッション";
    const saved: Session = { ...current, title };
    setHistory([saved, ...history]);
    setCurrent(initialSession());
    // 保存後は記録ページのままでも良いが、一覧で確認できるようログへ遷移
    navigate("/logs");
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

  return (
    <section className="space-y-6">
      <SessionForm value={current} onChange={setCurrent} onSave={handleSave} />
    </section>
  );
}
