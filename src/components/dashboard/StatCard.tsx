import React from "react";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  gradient?: string; // pass tailwind gradient classes
};

export default function StatCard({ label, value, hint, icon, gradient }: Props) {
  return (
    <div
      className={`rounded-2xl p-5 text-white shadow-sm ${
        gradient || "bg-gradient-to-br from-sky-500 to-emerald-500"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <p className="mt-1 text-xs opacity-80">{hint}</p>}
    </div>
  );
}