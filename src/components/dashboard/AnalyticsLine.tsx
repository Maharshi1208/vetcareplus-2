import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const sample = [
  { day: "Mon", appts: 8 },
  { day: "Tue", appts: 12 },
  { day: "Wed", appts: 10 },
  { day: "Thu", appts: 14 },
  { day: "Fri", appts: 11 },
  { day: "Sat", appts: 6 },
  { day: "Sun", appts: 5 },
];

export default function AnalyticsLine() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Appointments (last 7 days)</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sample} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="appts" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
