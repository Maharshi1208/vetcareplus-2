import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function PayCheckoutPage() {
  const { apptId } = useParams<{ apptId: string }>();
  const navigate = useNavigate();

  // Mock appointment/payment info (UI-only)
  const [amount] = useState<number>(75.0);
  const [method, setMethod] = useState<"CARD" | "UPI" | "CASH">("CARD");
  const [note, setNote] = useState("");

  function complete(status: "SUCCESS" | "FAILED") {
    // UI-only: pretend a payment happened and go to result screen
    navigate("/pay/result", {
      replace: true,
      state: {
        receipt: {
          id: "rcpt_" + Math.random().toString(36).slice(2, 8),
          apptId: apptId ?? "unknown",
          amount,
          status,
          method,
          note: note.trim() || undefined,
          when: new Date().toISOString(),
        },
        flash: {
          type: status === "SUCCESS" ? "success" : "error",
          message:
            status === "SUCCESS" ? "Payment successful" : "Payment failed (mock)",
        },
      },
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mock Checkout</h1>
          <p className="text-sm text-gray-500">
            UI-only payment for appointment{" "}
            <span className="font-medium">{apptId ?? "—"}</span>.
          </p>
        </div>
        <Link to="/appointments" className="text-sm underline">
          ← Back to Appointments
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Payment Details</h2>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-gray-500">Appointment</div>
              <div className="text-sm font-medium">{apptId ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Amount</div>
              <div className="text-sm font-medium">${amount.toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              >
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reference / last 4 / remarks…"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
          <button
            onClick={() => complete("FAILED")}
            className="rounded-xl border px-5 py-2 text-rose-700 hover:bg-rose-50"
          >
            Simulate Failed
          </button>
          <button
            onClick={() => complete("SUCCESS")}
            className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            Pay ${amount.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
