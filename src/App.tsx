import { Link, NavLink, Route, Routes } from "react-router-dom";
import RecordPage from "./pages/RecordPage";
import LogPage from "./pages/LogPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight">トレログ MVP</Link>
          <nav className="ml-auto text-sm text-gray-600 flex gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                (isActive ? "text-black" : "text-gray-600") + " hover:underline"
              }
              end
            >
              トレーニング入力
            </NavLink>
            <NavLink
              to="/logs"
              className={({ isActive }) =>
                (isActive ? "text-black" : "text-gray-600") + " hover:underline"
              }
            >
              トレーニング記録
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/logs" element={<LogPage />} />
        </Routes>
      </main>
    </div>
  );
}
