import React, { useEffect, useState } from "react";

type Status = "checking" | "online" | "offline";

export default function ApiHealth({
  check = async () => {
    // UI-only mock:
    // pretend to check for 400ms, then return "online"
    await new Promise((r) => setTimeout(r, 400));
    return true; // change to real fetch later
  },
  className = "",
}: {
  check?: () => Promise<boolean>;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await check();
        if (!alive) return;
        setStatus(ok ? "online" : "offline");
      } catch {
        if (!alive) return;
        setStatus("offline");
      }
    })();
    return () => {
      alive = false;
    };
  }, [check]);

  const style =
    status === "online"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "offline"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-gray-200 bg-gray-50 text-gray-700";

  const dot =
    status === "online"
      ? "bg-green-500"
      : status === "offline"
      ? "bg-red-500"
      : "bg-gray-400";

  const label =
    status === "online" ? "API Online" : status === "offline" ? "API Offline" : "Checking…";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm ${style} ${className}`}
      title="Backend API health"
    >
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      <span className="font-medium">{label}</span>
    </span>
  );
}
