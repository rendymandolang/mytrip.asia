"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 p-4 text-white">
        <h1 className="text-2xl font-bold">
          MYTRIP Admin Dashboard
        </h1>
      </div>

      <div className="p-8">
        <p className="mb-8 text-gray-600">
          Welcome to MYTRIP Property Management System
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/properties"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Properties
            </h2>

            <p className="mt-2 text-gray-500">
              Manage hotels, villas and resorts
            </p>
          </Link>

          <Link
            href="/admin/rooms"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Rooms
            </h2>

            <p className="mt-2 text-gray-500">
              Manage rooms and rates
            </p>
          </Link>

          <Link
            href="/admin/bookings"
            className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Bookings
            </h2>

            <p className="mt-2 text-gray-500">
              Manage reservations
            </p>
          </Link>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 p-6 text-white shadow transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">
            System Status
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">
                Properties Module
              </div>

              <div className="mt-2 font-semibold text-green-600">
                Active
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">
                Rooms Module
              </div>

              <div className="mt-2 font-semibold text-green-600">
                Active
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">
                Bookings Module
              </div>

              <div className="mt-2 font-semibold text-green-600">
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
