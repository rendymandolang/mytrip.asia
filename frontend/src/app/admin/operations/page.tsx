"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const HOUSEKEEPING_STATUSES = [
  "CLEAN",
  "DIRTY",
  "INSPECTING",
  "OUT_OF_SERVICE",
];

function toDateKey(value: string | Date) {
  const date =
    value instanceof Date ? value : new Date(value);

  return date.toISOString().slice(0, 10);
}

function statusBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "CONFIRMED") {
    return `${base} bg-blue-100 text-blue-700`;
  }

  if (status === "COMPLETED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "CANCELLED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  return `${base} bg-amber-100 text-amber-700`;
}

function housekeepingBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "CLEAN") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "DIRTY") {
    return `${base} bg-amber-100 text-amber-700`;
  }

  if (status === "OUT_OF_SERVICE") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  return `${base} bg-blue-100 text-blue-700`;
}

export default function OperationsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return toDateKey(date);
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      arrivals: bookings.filter(
        (booking) =>
          !booking.checkedInAt &&
          booking.status !== "COMPLETED",
      ).length,
      inHouse: bookings.filter(
        (booking) =>
          booking.checkedInAt &&
          !booking.checkedOutAt &&
          booking.status !== "COMPLETED",
      ).length,
      dirtyRooms: rooms.filter(
        (room) =>
          room.housekeepingStatus === "DIRTY",
      ).length,
      outOfService: rooms.filter(
        (room) =>
          room.housekeepingStatus ===
          "OUT_OF_SERVICE",
      ).length,
    };
  }, [bookings, rooms]);

  useEffect(() => {
    loadOperations();
  }, []);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadOperations() {
    try {
      setLoading(true);
      setMessage("");

      const query = `startDate=${startDate}&endDate=${endDate}`;
      const [bookingsResponse, roomsResponse] =
        await Promise.all([
          fetch(`/api/operations/bookings?${query}`, {
            headers: headers(),
          }),
          fetch("/api/operations/housekeeping", {
            headers: headers(),
          }),
        ]);

      if (!bookingsResponse.ok || !roomsResponse.ok) {
        throw new Error(
          "Operations data failed to load",
        );
      }

      setBookings(await bookingsResponse.json());
      setRooms(await roomsResponse.json());
    } catch (error) {
      console.error(error);
      setMessage("Operations data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function postAction(
    path: string,
    successMessage: string,
  ) {
    const response = await fetch(path, {
      method: "POST",
      headers: headers(),
    });

    if (!response.ok) {
      setMessage("Action failed");
      return;
    }

    setMessage(successMessage);
    await loadOperations();
  }

  async function updateHousekeeping(
    roomId: number,
    housekeepingStatus: string,
  ) {
    const response = await fetch(
      `/api/operations/rooms/${roomId}/housekeeping`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          housekeepingStatus,
        }),
      },
    );

    if (!response.ok) {
      setMessage("Housekeeping status failed to update");
      return;
    }

    setMessage("Housekeeping status updated");
    await loadOperations();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Operations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Front desk, check-in/out and housekeeping
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/calendar"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Calendar
          </Link>
          <Link
            href="/admin"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
          {message}
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Arrivals
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : stats.arrivals}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            In House
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : stats.inHouse}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Dirty Rooms
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {loading ? "-" : stats.dirtyRooms}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Out of Service
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">
            {loading ? "-" : stats.outOfService}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={loadOperations}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Load
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Booking</th>
              <th className="p-4 text-left">Guest</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Room</th>
              <th className="p-4 text-left">Stay</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Invoice</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-5 text-slate-500"
                >
                  No operational bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b"
                >
                  <td className="p-4 font-semibold">
                    #{booking.id}
                  </td>
                  <td className="p-4">
                    {booking.guest?.fullName ||
                      booking.user?.fullName ||
                      "-"}
                  </td>
                  <td className="p-4">
                    {booking.room?.property?.name || "-"}
                  </td>
                  <td className="p-4">
                    {booking.room?.name || "-"}
                  </td>
                  <td className="p-4">
                    {toDateKey(booking.checkIn)} to{" "}
                    {toDateKey(booking.checkOut)}
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
                    {booking.invoice?.status || "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {!booking.checkedInAt &&
                        booking.status !==
                          "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() =>
                              postAction(
                                `/api/operations/bookings/${booking.id}/check-in`,
                                "Guest checked in",
                              )
                            }
                            className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Check In
                          </button>
                        )}

                      {!booking.checkedOutAt &&
                        booking.status !==
                          "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() =>
                              postAction(
                                `/api/operations/bookings/${booking.id}/check-out`,
                                "Guest checked out",
                              )
                            }
                            className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Check Out
                          </button>
                        )}

                      {booking.status ===
                        "COMPLETED" && (
                        <span className="text-sm text-slate-400">
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Room</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Update</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                className="border-b"
              >
                <td className="p-4 font-semibold">
                  {room.name}
                </td>
                <td className="p-4">
                  {room.property?.name || "-"}
                </td>
                <td className="p-4">
                  {room.roomType?.name || "-"}
                </td>
                <td className="p-4">
                  <span
                    className={housekeepingBadge(
                      room.housekeepingStatus,
                    )}
                  >
                    {room.housekeepingStatus}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    value={room.housekeepingStatus}
                    onChange={(event) =>
                      updateHousekeeping(
                        room.id,
                        event.target.value,
                      )
                    }
                    className="rounded border border-slate-200 px-3 py-2"
                  >
                    {HOUSEKEEPING_STATUSES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
