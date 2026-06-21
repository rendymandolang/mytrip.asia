"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";

const DAY_WIDTH = 76;
const ROOM_WIDTH = 250;
const ROW_HEIGHT = 104;
const DAY_MS = 24 * 60 * 60 * 1000;

type Message = {
  type: "success" | "error";
  text: string;
};

type CalendarRoom = {
  id: number;
  name: string;
  housekeepingStatus?: string;
  property?: {
    name?: string;
  };
  roomType?: {
    name?: string;
  };
  bookings?: CalendarBooking[];
  availabilityBlocks?: AvailabilityBlock[];
};

type CalendarBooking = {
  id: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount?: string;
  user?: {
    fullName?: string;
    email?: string;
  };
};

type AvailabilityBlock = {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
};

type DailyAvailability = {
  date: string;
  totalRooms: number;
  bookedRooms: number;
  blockedRooms: number;
  availableRooms: number;
};

type DragPayload = {
  booking: CalendarBooking;
  sourceRoom: CalendarRoom;
};

function keyToDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKey(value: string | Date) {
  const date =
    value instanceof Date ? value : new Date(value);

  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, days: number) {
  const date = keyToDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return toDateKey(date);
}

function daysBetween(
  startDateKey: string,
  endDateKey: string,
) {
  return Math.round(
    (keyToDate(endDateKey).getTime() -
      keyToDate(startDateKey).getTime()) /
      DAY_MS,
  );
}

function buildDays(startDateKey: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    addDays(startDateKey, index),
  );
}

function formatDay(dateKey: string) {
  return keyToDate(dateKey).toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      day: "2-digit",
    },
  );
}

function formatShortDate(dateKey: string) {
  return keyToDate(dateKey).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
    },
  );
}

function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return startA < endB && endA > startB;
}

function apiMessage(payload: any) {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }

  return payload?.message || "Request failed";
}

export default function PmsCalendarPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<CalendarRoom[]>(
    [],
  );
  const [dailyAvailability, setDailyAvailability] =
    useState<DailyAvailability[]>([]);
  const [startDate, setStartDate] = useState(() =>
    toDateKey(new Date()),
  );
  const [viewDays, setViewDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] =
    useState<Message | null>(null);
  const [dragPayload, setDragPayload] =
    useState<DragPayload | null>(null);
  const [hoverCell, setHoverCell] = useState("");
  const [submittingMove, setSubmittingMove] =
    useState<number | null>(null);

  const days = useMemo(
    () => buildDays(startDate, viewDays),
    [startDate, viewDays],
  );

  const endDate = useMemo(
    () => addDays(startDate, viewDays),
    [startDate, viewDays],
  );

  const dailyByDate = useMemo(() => {
    const summary = new Map<
      string,
      {
        totalRooms: number;
        bookedRooms: number;
        blockedRooms: number;
        availableRooms: number;
      }
    >();

    for (const day of dailyAvailability) {
      const key = toDateKey(day.date);
      const current =
        summary.get(key) || {
          totalRooms: 0,
          bookedRooms: 0,
          blockedRooms: 0,
          availableRooms: 0,
        };

      current.totalRooms += day.totalRooms || 0;
      current.bookedRooms += day.bookedRooms || 0;
      current.blockedRooms += day.blockedRooms || 0;
      current.availableRooms +=
        day.availableRooms || 0;

      summary.set(key, current);
    }

    return summary;
  }, [dailyAvailability]);

  const activeBookings = useMemo(() => {
    const ids = new Set<number>();

    for (const room of rooms) {
      for (const booking of room.bookings || []) {
        if (booking.status !== "CANCELLED") {
          ids.add(booking.id);
        }
      }
    }

    return ids.size;
  }, [rooms]);

  useEffect(() => {
    loadCalendar();
  }, [startDate, viewDays]);

  async function loadCalendar() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const query =
        `startDate=${startDate}&endDate=${endDate}`;

      const [
        calendarResponse,
        dailyResponse,
      ] = await Promise.all([
        fetch(`/api/availability/calendar?${query}`, {
          headers,
        }),
        fetch(`/api/availability/daily?${query}`, {
          headers,
        }),
      ]);

      if (!calendarResponse.ok) {
        throw new Error(
          "Calendar data could not be loaded",
        );
      }

      const calendarData =
        await calendarResponse.json();

      setRooms(calendarData);

      if (dailyResponse.ok) {
        setDailyAvailability(
          await dailyResponse.json(),
        );
      } else {
        setDailyAvailability([]);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Calendar data could not be loaded",
      });
    } finally {
      setLoading(false);
    }
  }

  function moveWindow(daysToMove: number) {
    setStartDate((current) =>
      addDays(current, daysToMove),
    );
  }

  function bookingLayout(booking: CalendarBooking) {
    const bookingStart = toDateKey(booking.checkIn);
    const bookingEnd = toDateKey(booking.checkOut);
    const startOffset = daysBetween(
      startDate,
      bookingStart,
    );
    const endOffset = daysBetween(
      startDate,
      bookingEnd,
    );
    const visibleStart = Math.max(startOffset, 0);
    const visibleEnd = Math.min(endOffset, viewDays);

    if (visibleEnd <= visibleStart) {
      return null;
    }

    return {
      left: visibleStart * DAY_WIDTH + 6,
      width:
        (visibleEnd - visibleStart) * DAY_WIDTH - 12,
    };
  }

  function blockLayout(block: AvailabilityBlock) {
    const blockStart = toDateKey(block.startDate);
    const blockEnd = toDateKey(block.endDate);
    const startOffset = daysBetween(
      startDate,
      blockStart,
    );
    const endOffset = daysBetween(startDate, blockEnd);
    const visibleStart = Math.max(startOffset, 0);
    const visibleEnd = Math.min(endOffset, viewDays);

    if (visibleEnd <= visibleStart) {
      return null;
    }

    return {
      left: visibleStart * DAY_WIDTH + 8,
      width:
        (visibleEnd - visibleStart) * DAY_WIDTH - 16,
    };
  }

  function statusColor(status: string) {
    if (status === "CONFIRMED") {
      return "border-blue-500 bg-blue-600 text-white";
    }

    if (status === "PENDING") {
      return "border-amber-400 bg-amber-100 text-amber-900";
    }

    if (status === "COMPLETED") {
      return "border-emerald-500 bg-emerald-600 text-white";
    }

    return "border-slate-300 bg-slate-100 text-slate-500";
  }

  function blockColor(type: string) {
    if (type === "MAINTENANCE") {
      return "bg-rose-100 text-rose-700";
    }

    if (type === "OWNER_USE") {
      return "bg-violet-100 text-violet-700";
    }

    if (type === "HOLD") {
      return "bg-cyan-100 text-cyan-700";
    }

    return "bg-slate-200 text-slate-700";
  }

  function canDragBooking(booking: CalendarBooking) {
    return !["CANCELLED", "COMPLETED"].includes(
      booking.status,
    );
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    booking: CalendarBooking,
    sourceRoom: CalendarRoom,
  ) {
    if (!canDragBooking(booking)) {
      event.preventDefault();
      return;
    }

    setDragPayload({ booking, sourceRoom });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      String(booking.id),
    );
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    roomId: number,
    dateKey: string,
  ) {
    if (!dragPayload) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setHoverCell(`${roomId}:${dateKey}`);
  }

  function findConflict(
    room: CalendarRoom,
    movingBookingId: number,
    nextCheckIn: string,
    nextCheckOut: string,
  ) {
    for (const booking of room.bookings || []) {
      if (
        booking.id === movingBookingId ||
        booking.status === "CANCELLED"
      ) {
        continue;
      }

      if (
        overlaps(
          nextCheckIn,
          nextCheckOut,
          toDateKey(booking.checkIn),
          toDateKey(booking.checkOut),
        )
      ) {
        return `Conflict with booking #${booking.id}`;
      }
    }

    for (const block of room.availabilityBlocks || []) {
      if (
        overlaps(
          nextCheckIn,
          nextCheckOut,
          toDateKey(block.startDate),
          toDateKey(block.endDate),
        )
      ) {
        return `Room is blocked: ${block.type}`;
      }
    }

    return "";
  }

  async function submitMoveRequest(
    targetRoom: CalendarRoom,
    targetDate: string,
  ) {
    if (!dragPayload) {
      return;
    }

    const { booking, sourceRoom } = dragPayload;
    const currentCheckIn = toDateKey(booking.checkIn);
    const currentCheckOut = toDateKey(booking.checkOut);
    const nights = Math.max(
      daysBetween(currentCheckIn, currentCheckOut),
      1,
    );
    const nextCheckIn = targetDate;
    const nextCheckOut = addDays(targetDate, nights);

    setHoverCell("");

    if (
      targetRoom.id === booking.roomId &&
      nextCheckIn === currentCheckIn &&
      nextCheckOut === currentCheckOut
    ) {
      setDragPayload(null);
      return;
    }

    const conflict = findConflict(
      targetRoom,
      booking.id,
      nextCheckIn,
      nextCheckOut,
    );

    if (conflict) {
      setMessage({
        type: "error",
        text: conflict,
      });
      setDragPayload(null);
      return;
    }

    try {
      setSubmittingMove(booking.id);
      setMessage(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/bookings/${booking.id}/change-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomId: targetRoom.id,
            checkIn:
              keyToDate(nextCheckIn).toISOString(),
            checkOut:
              keyToDate(nextCheckOut).toISOString(),
            auditReason:
              `Calendar move from ${sourceRoom.name} ` +
              `${currentCheckIn}-${currentCheckOut} ` +
              `to ${targetRoom.name} ` +
              `${nextCheckIn}-${nextCheckOut}`,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => null);

        throw new Error(apiMessage(payload));
      }

      setMessage({
        type: "success",
        text:
          `Booking #${booking.id} move submitted ` +
          "for approval",
      });

      await loadCalendar();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Move request failed",
      });
    } finally {
      setSubmittingMove(null);
      setDragPayload(null);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    room: CalendarRoom,
    dateKey: string,
  ) {
    event.preventDefault();
    submitMoveRequest(room, dateKey);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            PMS Calendar
          </h1>
          <div className="mt-1 text-sm text-slate-500">
            {formatShortDate(startDate)} -{" "}
            {formatShortDate(addDays(endDate, -1))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow"
          >
            Bookings
          </Link>
          <Link
            href="/admin"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Rooms
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : rooms.length}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Active Bookings
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : activeBookings}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Window
          </div>
          <div className="mt-1 text-2xl font-bold">
            {viewDays} days
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Moving
          </div>
          <div className="mt-1 text-2xl font-bold">
            {submittingMove
              ? `#${submittingMove}`
              : "-"}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-lg bg-white p-4 shadow">
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
              Days
            </label>
            <div className="flex overflow-hidden rounded border border-slate-200">
              {[14, 30].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setViewDays(count)}
                  className={`px-4 py-2 text-sm font-semibold ${
                    viewDays === count
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => moveWindow(-viewDays)}
              className="rounded bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setStartDate(toDateKey(new Date()))}
              className="rounded bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveWindow(viewDays)}
              className="rounded bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Next
            </button>
            <button
              type="button"
              onClick={loadCalendar}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-5 rounded border p-4 text-sm font-semibold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <div
          className="min-w-max"
          style={{
            width: ROOM_WIDTH + viewDays * DAY_WIDTH,
          }}
        >
          <div
            className="sticky top-0 z-30 grid border-b border-slate-200 bg-white"
            style={{
              gridTemplateColumns: `${ROOM_WIDTH}px repeat(${viewDays}, ${DAY_WIDTH}px)`,
            }}
          >
            <div className="sticky left-0 z-40 border-r border-slate-200 bg-white p-4 text-sm font-bold">
              Room
            </div>

            {days.map((day) => {
              const summary = dailyByDate.get(day);

              return (
                <div
                  key={day}
                  className="border-r border-slate-200 p-2 text-center"
                >
                  <div className="text-sm font-bold">
                    {formatDay(day)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {summary
                      ? `${summary.availableRooms}/${summary.totalRooms}`
                      : "-"}
                  </div>
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="p-8 text-slate-500">
              Loading calendar...
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-slate-500">
              No rooms found.
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="grid border-b border-slate-200"
                style={{
                  gridTemplateColumns: `${ROOM_WIDTH}px ${viewDays * DAY_WIDTH}px`,
                  minHeight: ROW_HEIGHT,
                }}
              >
                <div className="sticky left-0 z-20 border-r border-slate-200 bg-white p-4">
                  <div className="font-bold">
                    {room.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {room.property?.name || "-"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {room.roomType?.name || "Room"}
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {room.housekeepingStatus ||
                        "CLEAN"}
                    </span>
                  </div>
                </div>

                <div
                  className="relative"
                  style={{ minHeight: ROW_HEIGHT }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${viewDays}, ${DAY_WIDTH}px)`,
                      minHeight: ROW_HEIGHT,
                    }}
                  >
                    {days.map((day) => {
                      const cellKey = `${room.id}:${day}`;
                      const isHover =
                        hoverCell === cellKey;

                      return (
                        <div
                          key={cellKey}
                          onDragOver={(event) =>
                            handleDragOver(
                              event,
                              room.id,
                              day,
                            )
                          }
                          onDragLeave={() => {
                            if (hoverCell === cellKey) {
                              setHoverCell("");
                            }
                          }}
                          onDrop={(event) =>
                            handleDrop(
                              event,
                              room,
                              day,
                            )
                          }
                          className={`border-r border-slate-100 ${
                            isHover
                              ? "bg-blue-50"
                              : "bg-white"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {(room.availabilityBlocks || []).map(
                    (block) => {
                      const layout =
                        blockLayout(block);

                      if (!layout) {
                        return null;
                      }

                      return (
                        <div
                          key={block.id}
                          className={`absolute top-[68px] h-6 truncate rounded px-2 py-1 text-[11px] font-semibold ${blockColor(block.type)}`}
                          style={{
                            left: layout.left,
                            width: layout.width,
                          }}
                          title={
                            block.reason || block.type
                          }
                        >
                          {block.type}
                        </div>
                      );
                    },
                  )}

                  {(room.bookings || []).map(
                    (booking) => {
                      const layout =
                        bookingLayout(booking);

                      if (!layout) {
                        return null;
                      }

                      const guest =
                        booking.user?.fullName ||
                        booking.user?.email ||
                        `Booking #${booking.id}`;

                      return (
                        <div
                          key={booking.id}
                          draggable={canDragBooking(
                            booking,
                          )}
                          onDragStart={(event) =>
                            handleDragStart(
                              event,
                              booking,
                              room,
                            )
                          }
                          onDragEnd={() => {
                            setDragPayload(null);
                            setHoverCell("");
                          }}
                          className={`absolute top-3 h-12 cursor-move truncate rounded border px-3 py-2 text-xs shadow-sm ${statusColor(booking.status)} ${
                            canDragBooking(booking)
                              ? "opacity-100"
                              : "cursor-not-allowed opacity-70"
                          }`}
                          style={{
                            left: layout.left,
                            width: layout.width,
                          }}
                          title={`${guest} ${toDateKey(booking.checkIn)} - ${toDateKey(booking.checkOut)}`}
                        >
                          <div className="truncate font-bold">
                            {guest}
                          </div>
                          <div className="truncate opacity-85">
                            #{booking.id} {booking.status}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
