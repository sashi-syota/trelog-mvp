// File: src/components/ConfirmDialog.tsx
import { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = "確認",
  message,
  confirmText = "OK",
  cancelText = "キャンセル",
  onConfirm,
  onClose,
}: Props) {
  // Escで閉じる／Enterで確定（アクセシビリティ軽め対応）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog */}
      <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="text-lg font-semibold">{title}</div>
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="rounded-xl border px-3 py-2 bg-black text-white hover:opacity-90"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
