import { Card, Label, SectionTitle } from "./Field";
import { SetRow } from "./SetRow";
import type { ExerciseBlock, SetEntry } from "../types";
import { useState } from "react";

function uid() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
}

export function ExerciseBlockCard({
  value,
  onChange,
  onRemove,
}: {
  value: ExerciseBlock;
  onChange: (v: ExerciseBlock) => void;
  onRemove: () => void;
}) {
  const [customName, setCustomName] = useState("");

  function addSet(copyFromLast = false) {
    const last = value.sets[value.sets.length - 1];
    const base: SetEntry =
      last && copyFromLast
        ? { ...last, id: uid(), setNumber: value.sets.length + 1 }
        : {
            id: uid(),
            setNumber: value.sets.length + 1,
            weightKg: "",
            reps: "",
            rpe: "",
            intervalSec: "",
            note: "",
          };
    onChange({ ...value, sets: [...value.sets, base] });
  }

  function updateSet(id: string, next: SetEntry) {
    onChange({
      ...value,
      sets: value.sets.map((s) => (s.id === id ? next : s)),
    });
  }

  function removeSet(id: string) {
    const sets = value.sets.filter((s) => s.id !== id).map((s, i) => ({ ...s, setNumber: i + 1 }));
    onChange({ ...value, sets });
  }

  const totalVolume = value.sets.reduce(
    (acc, s) =>
      acc +
      (typeof s.weightKg === "number" && typeof s.reps === "number" ? s.weightKg * s.reps : 0),
    0
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <SectionTitle>
            <span className="mr-2">🏋️</span>
            {value.name || "種目"}
          </SectionTitle>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 種目選択＋自由入力 */}
            <div>
              <Label>種目</Label>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
              >
                <option value="">選択してください</option>

                <optgroup label="コンパウンド">
                  <option value="スクワット">スクワット</option>
                  <option value="ベンチプレス">ベンチプレス</option>
                  <option value="デッドリフト">デッドリフト</option>
                  <option value="ショルダープレス">ショルダープレス</option>
                  <option value="ベントロウ">ベントロウ</option>
                </optgroup>

                <optgroup label="クイックリフト">
                  <option value="スナッチ">スナッチ</option>
                  <option value="クリーン">クリーン</option>
                  <option value="クリーン＆ジャーク">クリーン＆ジャーク</option>
                  <option value="プッシュプレス">プッシュプレス</option>
                </optgroup>

                <optgroup label="自重/公園">
                  <option value="プッシュアップ">プッシュアップ</option>
                  <option value="チンニング">チンニング</option>
                  <option value="ディップス">ディップス</option>
                  <option value="ブリッジ">ブリッジ</option>
                  <option value="スクワット（自重）">スクワット（自重）</option>
                  <option value="四股">四股</option>
                  <option value="縄跳び">縄跳び</option>
                  <option value="鍛錬棒">鍛錬棒</option>
                </optgroup>

                <optgroup label="ダッシュ/代謝系">
                  <option value="ダッシュ">ダッシュ</option>
                  <option value="ジョギング">ジョギング</option>
                  <option value="ヒルクライム">ヒルクライム</option>
                  <option value="パワーマックス">パワーマックス</option>
                </optgroup>

                <optgroup label="ジム/マシン（脚）">
                  <option value="ハックスクワット">脚 - ハックスクワット</option>
                  <option value="インナーサイ">脚 - インナーサイ</option>
                  <option value="アウターサイ">脚 - アウターサイ</option>
                  <option value="レバレッジスクワット">脚 - レバレッジスクワット</option>
                  <option value="シーテッドレッグカール">脚 - シーテッドレッグカール</option>
                  <option value="レッグエクステンション">脚 - レッグエクステンション</option>
                </optgroup>

                <optgroup label="ジム/マシン（背中）">
                  <option value="ラットプルダウン">背中 - ラットプルダウン</option>
                  <option value="Tバーロウ">背中 - Tバーロウ</option>
                  <option value="ハンマーロウ">背中 - ハンマーロウ</option>
                  <option value="ロープ登り">背中 - ロープ登り</option>
                </optgroup>

                <optgroup label="ジム/マシン（胸）">
                  <option value="チェストプレス">胸 - チェストプレス</option>
                  <option value="インクラインベンチプレス">胸 - インクラインベンチプレス</option>
                  <option value="チェストフライ">胸 - チェストフライ</option>
                </optgroup>

                <optgroup label="ジム/マシン（肩）">
                  <option value="ハンマーショルダープレス">肩 - ハンマーショルダープレス</option>
                  <option value="ケーブルレイズ">肩 - ケーブルレイズ</option>
                  <option value="リアレイズ">肩 - リアレイズ</option>
                </optgroup>

                <optgroup label="ジム/マシン（腕）">
                  <option value="ブリーチャーカール">腕 - ブリーチャーカール</option>
                  <option value="インクラインカール">腕 - インクラインカール</option>
                  <option value="バーベルカール">腕 - バーベルカール</option>
                  <option value="フレンチプレス">腕 - フレンチプレス</option>
                  <option value="ケーブルプレスダウン">腕 - ケーブルプレスダウン</option>
                  <option value="ケーブルフレンチプレス">腕 - ケーブルフレンチプレス</option>
                </optgroup>

                <optgroup label="柔道">
                  <option value="寝技　補強">寝技　補強</option>
                  <option value="寝技　乱取り">寝技　乱取り</option>
                  <option value="立技　補強">立技　補強</option>
                  <option value="立技　乱取り">立技　乱取り</option>
                </optgroup>
              </select>

              <div className="mt-2">
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="カスタム種目名（任意）"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onBlur={() => {
                    if (customName.trim()) {
                      onChange({ ...value, name: customName.trim() });
                    }
                  }}
                />
              </div>
            </div>

            {/* バリアント＋種目メモ */}
            <div>
              <Label>バリアント（任意）</Label>
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="例：Tempo 3-0-3 / ローバー / 坂50m×5本 など"
                value={value.variant ?? ""}
                onChange={(e) => onChange({ ...value, variant: e.target.value })}
              />

              <div className="mt-2">
                <Label>種目メモ（任意）</Label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2"
                  rows={2}
                  placeholder="この種目特有のメモを記録（ダッシュ・パワーマックスの詳細など）"
                  value={value.note ?? ""}
                  onChange={(e) => onChange({ ...value, note: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl border px-3 py-2 text-red-600 hover:bg-red-50"
        >
          削除
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-2 text-center">重量(kg)</div>
          <div className="col-span-2 text-center">レップ</div>
          <div className="col-span-2 text-center">RPE</div>
          <div className="col-span-2 text-center">レスト(s)</div>
          <div className="col-span-2 text-right pr-1">ボリューム</div>
          <div className="col-span-12 h-px bg-gray-100" />
        </div>

        {value.sets.map((s) => (
          <SetRow
            key={s.id}
            value={s}
            onChange={(next) => updateSet(s.id, next)}
            onRemove={() => removeSet(s.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addSet(false)}
          className="rounded-xl border px-3 py-2 hover:bg-gray-50"
        >
          ＋ セット追加
        </button>
        <button
          type="button"
          onClick={() => addSet(true)}
          className="rounded-xl border px-3 py-2 hover:bg-gray-50"
        >
          ＋ 前のセットを複製
        </button>
        <div className="ml-auto text-sm text-gray-700">
          合計ボリューム: <span className="font-semibold">{totalVolume} kg</span>
        </div>
      </div>
    </Card>
  );
}
