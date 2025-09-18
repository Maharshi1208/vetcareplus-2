import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type ApptStatus = "Booked" | "Rescheduled" | "Cancelled" | "Completed";

type Appointment = {
  id: string;
  date: string;   // YYYY-MM-DD
  start: string;  // HH:mm
  end: string;    // HH:mm
  petName: string;
  ownerName: string;
  vetName: string;
  reason?: string;
  status: ApptStatus;
};

// Keep in sync with the list for demo consistency
const MOCK_APPTS: Appointment[] = [
  { id: "a1", date: "2025-09-17", start: "09:00", end: "09:30", petName: "Buddy", ownerName: "Alice Johnson", vetName: "Dr. Anna Smith", reason: "Checkup", status: "Booked" },
  { id: "a2", date: "2025-09-17", start: "10:00", end: "10:45", petName: "Misty", ownerName: "Alice Johnson", vetName: "Dr. Brian Lee", reason: "Skin rash", status: "Completed" },
  { id: "a3", date: "2025-09-18", start: "11:30", end: "12:00", petName: "Kiwi",  ownerName: "Bob Patel",     vetName: "Dr. Carla Gomez", reason: "Beak trim", status: "Cancelled" },
];

function statusClass(s: ApptStatus) {
  switch (s) {
    case "Booked": return "bg-sky-100 text-sky-800 border border-sky-200";
    case "Rescheduled": return "bg-amber-100 text-amber-800 border border-amber-200";
    case "Cancelled": return "bg-rose-100 text-rose-800 border border-rose-200 line-through";
    case "Completed": return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  }
}

export default function ApptCalendarPage() {
  const events = useMemo(() => {
    return MOCK_APPTS.map((a) => ({
      id: a.id,
      title: `${a.petName} • ${a.vetName}`,
      start: `${a.date}T${a.start}:00`,
      end: `${a.date}T${a.end}:00`,
      extendedProps: a,
    }));
  }, []);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments — Calendar</h1>
          <p className="text-sm text-gray-500">Read-only calendar (no backend yet).</p>
        </div>
        <div className="flex gap-2">
          <Link to="/appointments" className="rounded-xl border px-4 py-2 hover:bg-gray-50">List View</Link>
          <Link to="/appointments/add" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">New Appointment</Link>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          nowIndicator={true}
          events={events}
          eventDidMount={(info) => {
            const a = info.event.extendedProps as Appointment;
            // add our Tailwind-y badge styles
            info.el.classList.add("rounded-md", "px-1", "py-0.5", "text-xs", "font-medium");
            const cls = statusClass(a.status);
            if (cls) cls.split(" ").forEach((c) => info.el.classList.add(c));
            // nicer tooltip
            info.el.title = `${a.petName} with ${a.vetName}\n${a.reason ?? ""}`.trim();
          }}
          eventClick={(arg) => {
            // Navigate to details (UI-only). Use <a> default behavior:
            window.location.href = `/appointments/${arg.event.id}`;
          }}
        />
      </div>
    </div>
  );
}
