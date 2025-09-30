import React from "react";

type Props = {
  password: string;
};

function calculateStrength(password: string) {
  let score = 0;

  if (password.length >= 6) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-600", value: 25 };
  if (score === 2) return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-600", value: 50 };
  if (score === 3) return { label: "Strong", color: "bg-green-500", text: "text-green-600", value: 75 };
  return { label: "Very Strong", color: "bg-green-600", text: "text-green-700", value: 100 };
}

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;

  const { label, color, text, value } = calculateStrength(password);

  return (
    <div className="mt-1">
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className={`text-sm mt-1 ${text}`}>Strength: {label}</p>
    </div>
  );
}
