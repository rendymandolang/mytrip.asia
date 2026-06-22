"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] =
    useState<any[]>([]);
  const [
    propertyApprovalRequests,
    setPropertyApprovalRequests,
  ] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        propertiesResponse,
        roomsResponse,
        bookingsResponse,
        approvalsResponse,
        propertyApprovalsResponse,
      ] = await Promise.all([
        fetch("/api/properties", { headers }),
        fetch("/api/rooms", { headers }),
        fetch("/api/bookings", { headers }),
        fetch(
          "/api/bookings/change-requests?status=PENDING",
          { headers },
        ),
        fetch(
          "/api/properties/review-requests/list?status=PENDING_REVIEW",
          { headers },
        ),
      ]);

      if (
        !propertiesResponse.ok ||
        !roomsResponse.ok ||
        !bookingsResponse.ok ||
        !approvalsResponse.ok ||
        !propertyApprovalsResponse.ok
      ) {
        throw new Error(
          "Failed to load dashboard data",
        );
      }

      const [
        propertiesData,
        roomsData,
        bookingsData,
        approvalsData,
        propertyApprovalsData,
      ] = await Promise.all([
        propertiesResponse.json(),
        roomsResponse.json(),
        bookingsResponse.json(),
        approvalsResponse.json(),
        propertyApprovalsResponse.json(),
      ]);

      setProperties(propertiesData);
      setRooms(roomsData);
      setBookings(bookingsData);
      setApprovalRequests(approvalsData);
      setPropertyApprovalRequests(
        propertyApprovalsData,
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Dashboard data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  }

  const bookingSummary = useMemo(() => {
    const summary = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const booking of bookings) {
      if (booking.status in summary) {
        summary[
          booking.status as keyof typeof summary
        ] += 1;
      }
    }

    return summary;
  }, [bookings]);

  const revenue = useMemo(() => {
    return bookings
      .filter(
        (booking) =>
          booking.status === "CONFIRMED" ||
          booking.status === "COMPLETED",
      )
      .reduce((total, booking) => {
        return (
          total + Number(booking.totalAmount || 0)
        );
      }, 0);
  }, [bookings]);

  const activeBookings = useMemo(() => {
    return bookings.filter(
      (booking) => booking.status !== "CANCELLED",
    ).length;
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return bookings.slice(0, 5);
  }, [bookings]);

  function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
  }

  function statusBadge(status: string) {
    const base =
      "rounded px-3 py-1 text-xs font-semibold";

    if (status === "PENDING") {
      return `${base} bg-yellow-100 text-yellow-700`;
    }

    if (status === "CONFIRMED") {
      return `${base} bg-blue-100 text-blue-700`;
    }

    if (status === "COMPLETED") {
      return `${base} bg-green-100 text-green-700`;
    }

    if (status === "CANCELLED") {
      return `${base} bg-red-100 text-red-700`;
    }

    return `${base} bg-slate-100 text-slate-700`;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 px-8 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              MYTRIP Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              {user?.fullName || "Admin"}{" "}
              {user?.role ? `- ${user.role}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/calendar"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Calendar
            </Link>

            <Link
              href="/admin/finance"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Finance
            </Link>

            <Link
              href="/admin/operations"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Operations
            </Link>

            <Link
              href="/admin/channel-manager"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Channel
            </Link>

            <Link
              href="/admin/property-approvals"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Property Reviews
            </Link>

            <Link
              href="/admin/users"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Users
            </Link>

            <Link
              href="/admin/partnerships"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Partners
            </Link>

            <Link
              href="/admin/settings"
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Settings
            </Link>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded bg-red-600 px-4 py-2 text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Properties
            </div>
            <div className="mt-2 text-3xl font-bold">
              {loading ? "-" : properties.length}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Rooms
            </div>
            <div className="mt-2 text-3xl font-bold">
              {loading ? "-" : rooms.length}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Active Bookings
            </div>
            <div className="mt-2 text-3xl font-bold">
              {loading ? "-" : activeBookings}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Booking Approvals
            </div>
            <div className="mt-2 text-3xl font-bold">
              {loading ? "-" : approvalRequests.length}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Property Reviews
            </div>
            <div className="mt-2 text-3xl font-bold">
              {loading
                ? "-"
                : propertyApprovalRequests.length}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="text-sm text-slate-500">
              Revenue
            </div>
            <div className="mt-2 text-2xl font-bold">
              {loading ? "-" : formatCurrency(revenue)}
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Recent Bookings
              </h2>

              <Link
                href="/admin/bookings"
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
              >
                Open
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-left">
                      ID
                    </th>
                    <th className="p-3 text-left">
                      Guest
                    </th>
                    <th className="p-3 text-left">
                      Room
                    </th>
                    <th className="p-3 text-left">
                      Status
                    </th>
                    <th className="p-3 text-left">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-slate-500"
                      >
                        No bookings yet.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b"
                      >
                        <td className="p-3">
                          {booking.id}
                        </td>
                        <td className="p-3">
                          {booking.user?.fullName ||
                            booking.guest?.fullName ||
                            "-"}
                        </td>
                        <td className="p-3">
                          {booking.room?.name || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={statusBadge(
                              booking.status,
                            )}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {formatCurrency(
                            Number(
                              booking.totalAmount ||
                                0,
                            ),
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">
              Booking Status
            </h2>

            <div className="space-y-3">
              {Object.entries(bookingSummary).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <span
                      className={statusBadge(status)}
                    >
                      {status}
                    </span>
                    <span className="font-semibold">
                      {count}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/properties"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Properties
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage hotels, villas and resorts
            </p>
          </Link>

          <Link
            href="/admin/property-approvals"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Property Approvals
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review partner property submissions
            </p>
          </Link>

          <Link
            href="/admin/rooms"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Rooms
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage rooms and rates
            </p>
          </Link>

          <Link
            href="/admin/room-types"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Room Types
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage 1BR, 2BR and unit categories
            </p>
          </Link>

          <Link
            href="/admin/bookings"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Bookings
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage reservations and approvals
            </p>
          </Link>

          <Link
            href="/admin/calendar"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Calendar
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Move reservations by room and date
            </p>
          </Link>

          <Link
            href="/admin/pricing-rules"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Pricing
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage daily, monthly and yearly rates
            </p>
          </Link>

          <Link
            href="/admin/finance"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Finance
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage invoices, payments and receivables
            </p>
          </Link>

          <Link
            href="/admin/operations"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Operations
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Handle check-in, check-out and housekeeping
            </p>
          </Link>

          <Link
            href="/admin/channel-manager"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Channel Manager
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Queue OTA events and ARI sync
            </p>
          </Link>

          <Link
            href="/admin/media"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Media
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage property and room galleries
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              User Management
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review users, status and account access
            </p>
          </Link>

          <Link
            href="/admin/partnerships"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Partnerships
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Approve or reject property owner registrations
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
