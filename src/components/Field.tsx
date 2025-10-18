import { ReactNode } from "react";

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-gray-600 mb-1">
      {children}
    </label>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border bg-white shadow-sm p-4">{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>;
}
