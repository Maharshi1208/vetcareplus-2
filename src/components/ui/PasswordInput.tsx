import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};
export default function PasswordInput({ label, error, className="", ...props }: Props) {
  const [show, setShow] = React.useState(false);
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 border-gray-300 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 px-3 text-xs text-gray-600 hover:text-gray-900"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
