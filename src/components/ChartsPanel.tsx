// File: src/components/ChartsPanel.tsx
import { useMemo } from "react";
import type { Session } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

type Mode = "month" | "week";

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border bg-white p-3">{children}</div>
);
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-semibold text-gray-700">{children}</h2>
);

export default function ChartsPanel({
  sessions,
  mode,
}: {
  sessions: Session[];
  mode: Mode;
}) {
  function ymKey(date: string | undefined) {
    return (date ?? "").slice(0, 7) || "未設定";
  }
  function ywKey(dateStr: string | undefined) {
    if (!dateStr) return "未設定";
    const d = new Date(dateStr + "T00:00:00");
    const day = (d.getDay() + 6) % 7; // 月=0 … 日=6
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const year = monday.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const diff = Math.floor((monday.getTime() - jan1.getTime()) / (24 * 3600 * 1000));
    const week = Math.floor(diff / 7) + 1;
    const ww = String(week).padStart(2, "0");
    return `${year}-W${ww}`;
  }

  const data = useMemo(() => {
    const keyFn = mode === "month" ? ymKey : ywKey;
    const map = new Map<string, { volume: number; rpeSum: number; setCount: number }>();

    for (const s of sessions) {
      const key = keyFn(s.date);
      if (!map.has(key)) map.set(key, { volume: 0, rpeSum: 0, setCount: 0 });
      const bucket = map.get(key)!;

      for (const ex of s.exercises) {
        for (const st of ex.sets) {
          const sc = typeof st.setsCount === "number" ? st.setsCount : 1;
          if (typeof st.weightKg === "number" && typeof st.reps === "number") {
            bucket.volume += st.weightKg * st.reps * sc;
          }
          if (typeof st.rpe === "number") {
            bucket.rpeSum += st.rpe * sc;
          }
          bucket.setCount += sc;
        }
      }
    }

    return Array.from(map.entries())
      .map(([label, v]) => ({
        label,
        volume: Math.round(v.volume),
        avgRPE: v.setCount > 0 ? Number((v.rpeSum / v.setCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [sessions, mode]);

  if (sessions.length === 0) return null;

  return (
    <Card>
      <SectionTitle>サマリー（{mode === "month" ? "月次" : "週次"}）</SectionTitle>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 合計ボリューム（Bar） */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" name="合計ボリューム(kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 平均RPE（Line） */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="avgRPE" name="平均RPE" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
