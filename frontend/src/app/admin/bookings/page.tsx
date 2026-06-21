"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [auditReason, setAuditReason] = useState("");

  const [auditBookingId, setAuditBookingId] =
    useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setBookings(data);
  }

  function resetForm() {
    setEditingId(null);
    setCheckIn("");
    setCheckOut("");
    setTotalAmount("");
    setStatus("PENDING");
    setAuditReason("");
  }

  function formatDateInput(dateValue: string) {
    return new Date(dateValue)
      .toISOString()
      .slice(0, 10);
  }

  function editBooking(booking: any) {
    setEditingId(booking.id);
    setCheckIn(formatDateInput(booking.checkIn));
    setCheckOut(formatDateInput(booking.checkOut));
    setTotalAmount(String(booking.totalAmount));
    setStatus(booking.status);
    setAuditReason("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateBooking(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    if (!auditReason.trim()) {
      alert("Correction reason is required");
      return;
    }

    const confirmed = confirm(
      "Update this booking? For real production data, this action should require finance approval.",
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    const response = await fetch(
      `/api/bookings/${editingId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          totalAmount,
          status,
          auditReason: auditReason.trim(),
        }),
      },
    );

    if (!response.ok) {
      alert("Failed to update booking");
      return;
    }

    resetForm();
    await loadBookings();

    alert("Booking updated successfully");
  }

  async function updateStatus(
    id: number,
    nextStatus: string,
  ) {
    const auditReason = prompt(
      `Reason for changing booking status to ${nextStatus}?`,
    );

    if (!auditReason?.trim()) {
      alert("Status change reason is required");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: nextStatus,
        auditReason: auditReason.trim(),
      }),
    });

    if (!response.ok) {
      alert("Failed to update booking status");
      return;
    }

    await loadBookings();
    alert("Booking status updated");
  }

  async function loadAuditLogs(bookingId: number) {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `/api/bookings/${bookingId}/audit-logs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      alert("Failed to load audit log");
      return;
    }

    const data = await response.json();

    setAuditBookingId(bookingId);
    setAuditLogs(data);
  }

  function changedValue(log: any, field: string) {
    const oldValue = log.oldData?.[field];
    const newValue = log.newData?.[field];

    if (String(oldValue) === String(newValue)) {
      return null;
    }

    return `${field}: ${oldValue ?? "-"} -> ${
      newValue ?? "-"
    }`;
  }

  function statusBadge(currentStatus: string) {
    const base =
      "rounded px-3 py-1 text-sm font-semibold";

    if (currentStatus === "PENDING") {
      return `${base} bg-yellow-100 text-yellow-700`;
    }

    if (currentStatus === "CONFIRMED") {
      return `${base} bg-blue-100 text-blue-700`;
    }

    if (currentStatus === "COMPLETED") {
      return `${base} bg-green-100 text-green-700`;
    }

    if (currentStatus === "CANCELLED") {
      return `${base} bg-red-100 text-red-700`;
    }

    return `${base} bg-gray-100 text-gray-700`;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Booking Management
        </h1>

        <Link
          href="/admin"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Dashboard
        </Link>
      </div>

      {editingId && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Edit Booking #{editingId}
          </h2>

          <form
            onSubmit={updateBooking}
            className="grid gap-4 md:grid-cols-4"
          >
            <input
              type="date"
              value={checkIn}
              onChange={(e) =>
                setCheckIn(e.target.value)
              }
              className="rounded border p-3"
              required
            />

            <input
              type="date"
              value={checkOut}
              onChange={(e) =>
                setCheckOut(e.target.value)
              }
              className="rounded border p-3"
              required
            />

            <input
              type="number"
              value={totalAmount}
              onChange={(e) =>
                setTotalAmount(e.target.value)
              }
              className="rounded border p-3"
              placeholder="Total Amount"
              required
            />

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="rounded border p-3"
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">
                CONFIRMED
              </option>
              <option value="COMPLETED">
                COMPLETED
              </option>
              <option value="CANCELLED">
                CANCELLED
              </option>
            </select>

            <textarea
              value={auditReason}
              onChange={(e) =>
                setAuditReason(e.target.value)
              }
              className="rounded border p-3 md:col-span-4"
              placeholder="Correction reason"
              required
            />

            <button
              type="submit"
              className="rounded bg-green-600 px-6 py-3 text-white"
            >
              Update Booking
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-slate-500 px-6 py-3 text-white"
            >
              Cancel Edit
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Note: For production, confirmed booking
            correction should require finance approval and
            audit log.
          </p>
        </div>
      )}

      {auditBookingId && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Audit Log #{auditBookingId}
            </h2>

            <button
              type="button"
              onClick={() => {
                setAuditBookingId(null);
                setAuditLogs([]);
              }}
              className="rounded bg-slate-500 px-4 py-2 text-white"
            >
              Close
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-gray-500">
              No audit log recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded border p-4"
                >
                  <div className="font-semibold">
                    {log.action}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {new Date(
                      log.createdAt,
                    ).toLocaleString()}{" "}
                    by{" "}
                    {log.actor?.fullName ||
                      log.actor?.email ||
                      "System"}
                  </div>

                  <div className="mt-2 text-sm">
                    Reason: {log.reason || "-"}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {[
                      "status",
                      "checkIn",
                      "checkOut",
                      "totalAmount",
                      "roomId",
                    ]
                      .map((field) =>
                        changedValue(log, field),
                      )
                      .filter(Boolean)
                      .map((change) => (
                        <div key={change}>{change}</div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1150px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Guest</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Room</th>
              <th className="p-4 text-left">Check In</th>
              <th className="p-4 text-left">Check Out</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b"
              >
                <td className="p-4">{booking.id}</td>

                <td className="p-4">
                  {booking.user?.fullName}
                </td>

                <td className="p-4">
                  {booking.room?.property?.name}
                </td>

                <td className="p-4">
                  {booking.room?.name}
                </td>

                <td className="p-4">
                  {new Date(
                    booking.checkIn,
                  ).toLocaleDateString()}
                </td>

                <td className="p-4">
                  {new Date(
                    booking.checkOut,
                  ).toLocaleDateString()}
                </td>

                <td className="p-4">
                  <span
                    className={statusBadge(
                      booking.status,
                    )}
                  >
                    {booking.status}
                  </span>
                </td>

                <td className="p-4">
                  Rp{" "}
                  {Number(
                    booking.totalAmount,
                  ).toLocaleString()}
                </td>

                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        editBooking(booking)
                      }
                      className="rounded bg-amber-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        loadAuditLogs(booking.id)
                      }
                      className="rounded bg-slate-700 px-3 py-1 text-white"
                    >
                      Audit
                    </button>

                    {booking.status === "PENDING" && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(
                              booking.id,
                              "CONFIRMED",
                            )
                          }
                          className="rounded bg-blue-600 px-3 py-1 text-white"
                        >
                          Confirm
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              booking.id,
                              "CANCELLED",
                            )
                          }
                          className="rounded bg-red-600 px-3 py-1 text-white"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === "CONFIRMED" && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(
                              booking.id,
                              "COMPLETED",
                            )
                          }
                          className="rounded bg-green-600 px-3 py-1 text-white"
                        >
                          Complete
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              booking.id,
                              "CANCELLED",
                            )
                          }
                          className="rounded bg-red-600 px-3 py-1 text-white"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === "COMPLETED" && (
                      <span className="text-sm text-gray-400">
                        Completed
                      </span>
                    )}

                    {booking.status === "CANCELLED" && (
                      <span className="text-sm text-gray-400">
                        Cancelled
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
