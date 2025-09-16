import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "solid" | "outline" | "ghost";
  full?: boolean;
};
export default function Button({
  loading,
  variant = "solid",
  full,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles =
    variant === "solid"
      ? "text-white bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 focus:ring-sky-300"
      : variant === "outline"
      ? "border border-sky-300 text-sky-700 hover:bg-sky-50 focus:ring-sky-200"
      : "text-sky-700 hover:bg-sky-50 focus:ring-sky-200";
  const width = full ? "w-full" : "";
  const disabledCls = (loading || disabled) ? "opacity-60 cursor-not-allowed" : "";

  return (
    <button
      className={`${base} ${styles} ${width} ${disabledCls} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
