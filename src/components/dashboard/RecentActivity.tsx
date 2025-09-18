import React from "react";
import { CalendarDays, PawPrint, DollarSign, User2 } from "lucide-react";

type Activity =
  | { id: string; type: "APPOINTMENT"; when: string; who: string; pet: string }
  | { id: string; type: "PET_ADDED"; when: string; who: string; pet: string }
  | { id: string; type: "INVOICE"; when: string; who: string; amount: string }
  | { id: string; type: "OWNER_ADDED"; when: string; who: string };

const iconMap: Record<Activity["type"], React.ReactNode> = {
  APPOINTMENT: <CalendarDays size={16} />,
  PET_ADDED: <PawPrint size={16} />,
  INVOICE: <DollarSign size={16} />,
  OWNER_ADDED: <User2 size={16} />,
};

function typeLabel(t: Activity["type"]) {
  switch (t) {
    case "APPOINTMENT": return "Appointment";
    case "PET_ADDED": return "New Pet";
    case "INVOICE": return "Invoice";
    case "OWNER_ADDED": return "New Owner";
  }
}

export default function RecentActivity({
  items = [],
}: {
  items?: Activity[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <a href="#" className="text-sm text-sky-700 hover:underline">View all</a>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Details</th>
              <th className="px-3 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-3">
                  <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
                    <span className="text-gray-500">{iconMap[row.type]}</span>
                    <span className="font-medium">{typeLabel(row.type)}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {row.type === "APPOINTMENT" && (
                    <span>
                      {row.who} booked an appointment for <b>{row.pet}</b>
                    </span>
                  )}
                  {row.type === "PET_ADDED" && (
                    <span>
                      {row.who} added a new pet <b>{row.pet}</b>
                    </span>
                  )}
                  {row.type === "INVOICE" && (
                    <span>
                      Invoice created for {row.who}: <b>{row.amount}</b>
                    </span>
                  )}
                  {row.type === "OWNER_ADDED" && (
                    <span>
                      New owner profile: <b>{row.who}</b>
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-500">{row.when}</td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-sm text-gray-500">
                  No recent activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
