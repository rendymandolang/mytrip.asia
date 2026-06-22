"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const EVENT_TYPES = [
  "ARI_UPDATE",
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "BOOKING_CANCELLED",
  "AVAILABILITY_SYNC",
  "RATE_SYNC",
];

const DIRECTIONS = ["INBOUND", "OUTBOUND"];

function statusBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "PROCESSED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "FAILED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  if (status === "PROCESSING") {
    return `${base} bg-blue-100 text-blue-700`;
  }

  return `${base} bg-amber-100 text-amber-700`;
}

export default function ChannelManagerPage() {
  const [properties, setProperties] = useState<any[]>(
    [],
  );
  const [connections, setConnections] = useState<any[]>(
    [],
  );
  const [events, setEvents] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [provider, setProvider] = useState("Manual OTA");
  const [externalPropertyId, setExternalPropertyId] =
    useState("");
  const [eventPropertyId, setEventPropertyId] =
    useState("");
  const [eventType, setEventType] = useState(
    "BOOKING_CREATED",
  );
  const [direction, setDirection] =
    useState("INBOUND");
  const [payload, setPayload] = useState(
    '{"source":"manual"}',
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      activeConnections: connections.filter(
        (connection) => connection.active,
      ).length,
      pendingEvents: events.filter(
        (event) => event.status === "PENDING",
      ).length,
      failedEvents: events.filter(
        (event) => event.status === "FAILED",
      ).length,
      processedEvents: events.filter(
        (event) => event.status === "PROCESSED",
      ).length,
    };
  }, [connections, events]);

  useEffect(() => {
    loadChannelManager();
  }, []);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadChannelManager() {
    try {
      setLoading(true);
      setMessage("");

      const [
        propertiesResponse,
        connectionsResponse,
        eventsResponse,
      ] = await Promise.all([
        fetch("/api/properties", {
          headers: headers(),
        }),
        fetch("/api/channel-manager/connections", {
          headers: headers(),
        }),
        fetch("/api/channel-manager/events", {
          headers: headers(),
        }),
      ]);

      if (
        !propertiesResponse.ok ||
        !connectionsResponse.ok ||
        !eventsResponse.ok
      ) {
        throw new Error(
          "Channel manager data failed to load",
        );
      }

      const propertiesData =
        await propertiesResponse.json();

      setProperties(propertiesData);
      setConnections(
        await connectionsResponse.json(),
      );
      setEvents(await eventsResponse.json());

      if (!propertyId && propertiesData[0]) {
        setPropertyId(String(propertiesData[0].id));
      }

      if (!eventPropertyId && propertiesData[0]) {
        setEventPropertyId(
          String(propertiesData[0].id),
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "Channel manager data could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createConnection(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const response = await fetch(
      "/api/channel-manager/connections",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          propertyId,
          provider,
          externalPropertyId,
        }),
      },
    );

    if (!response.ok) {
      setMessage("Connection could not be created");
      return;
    }

    setMessage("Connection created");
    await loadChannelManager();
  }

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch(
      "/api/channel-manager/events",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          propertyId: eventPropertyId,
          direction,
          eventType,
          payload,
        }),
      },
    );

    if (!response.ok) {
      setMessage("Event could not be queued");
      return;
    }

    setMessage("Event queued");
    await loadChannelManager();
  }

  async function processEvent(eventId: number) {
    const response = await fetch(
      `/api/channel-manager/events/${eventId}/process`,
      {
        method: "POST",
        headers: headers(),
      },
    );

    if (!response.ok) {
      setMessage("Event could not be processed");
      return;
    }

    setMessage("Event processed");
    await loadChannelManager();
  }

  async function syncProperty(id: string) {
    if (!id) {
      return;
    }

    const response = await fetch(
      `/api/channel-manager/properties/${id}/sync`,
      {
        method: "POST",
        headers: headers(),
      },
    );

    if (!response.ok) {
      setMessage("Property sync could not be queued");
      return;
    }

    setMessage("Property sync queued");
    await loadChannelManager();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Channel Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            OTA connections, ARI sync and event queue
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadChannelManager}
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Refresh
          </button>
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
            Active Connections
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : stats.activeConnections}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Pending Events
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {loading ? "-" : stats.pendingEvents}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Processed
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {loading ? "-" : stats.processedEvents}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Failed
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">
            {loading ? "-" : stats.failedEvents}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={createConnection}
          className="rounded-lg bg-white p-4 shadow"
        >
          <h2 className="mb-3 text-lg font-bold">
            Add OTA Connection
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={propertyId}
              onChange={(event) =>
                setPropertyId(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            >
              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>
              ))}
            </select>

            <input
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
              placeholder="Provider"
            />

            <input
              value={externalPropertyId}
              onChange={(event) =>
                setExternalPropertyId(
                  event.target.value,
                )
              }
              className="rounded border border-slate-200 px-3 py-2"
              placeholder="External ID"
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Create Connection
          </button>
        </form>

        <form
          onSubmit={createEvent}
          className="rounded-lg bg-white p-4 shadow"
        >
          <h2 className="mb-3 text-lg font-bold">
            Queue Event
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={eventPropertyId}
              onChange={(event) =>
                setEventPropertyId(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            >
              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>
              ))}
            </select>

            <select
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            >
              {DIRECTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={eventType}
              onChange={(event) =>
                setEventType(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            >
              {EVENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={payload}
            onChange={(event) =>
              setPayload(event.target.value)
            }
            className="mt-3 h-20 w-full rounded border border-slate-200 px-3 py-2 font-mono text-sm"
          />

          <button
            type="submit"
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Queue Event
          </button>
        </form>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              Push ARI Sync
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create outbound availability/rate/inventory
              event for a property.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={eventPropertyId}
              onChange={(event) =>
                setEventPropertyId(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
            >
              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                syncProperty(eventPropertyId)
              }
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Sync Property
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Provider</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">External ID</th>
              <th className="p-4 text-left">Active</th>
              <th className="p-4 text-left">Last Sync</th>
            </tr>
          </thead>

          <tbody>
            {connections.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-5 text-slate-500"
                >
                  No channel connections yet.
                </td>
              </tr>
            ) : (
              connections.map((connection) => (
                <tr
                  key={connection.id}
                  className="border-b"
                >
                  <td className="p-4 font-semibold">
                    {connection.provider}
                  </td>
                  <td className="p-4">
                    {connection.property?.name || "-"}
                  </td>
                  <td className="p-4">
                    {connection.externalPropertyId ||
                      "-"}
                  </td>
                  <td className="p-4">
                    {connection.active ? "Yes" : "No"}
                  </td>
                  <td className="p-4">
                    {connection.lastSyncAt
                      ? new Date(
                          connection.lastSyncAt,
                        ).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1120px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Event</th>
              <th className="p-4 text-left">Direction</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Booking</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Attempts</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-5 text-slate-500"
                >
                  No channel events yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b"
                >
                  <td className="p-4 font-semibold">
                    {event.eventType}
                  </td>
                  <td className="p-4">
                    {event.direction}
                  </td>
                  <td className="p-4">
                    {event.property?.name || "-"}
                  </td>
                  <td className="p-4">
                    {event.bookingId
                      ? `#${event.bookingId}`
                      : "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={statusBadge(
                        event.status,
                      )}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {event.attempts}
                  </td>
                  <td className="p-4">
                    {new Date(
                      event.createdAt,
                    ).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {event.status !== "PROCESSED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          processEvent(event.id)
                        }
                        className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Process
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Done
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
