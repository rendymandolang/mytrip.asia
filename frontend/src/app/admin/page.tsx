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
          Welcome to MYTRIP Management System
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/properties"
            className="rounded-lg bg-white p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">
              Properties
            </h2>

            <p className="mt-2 text-gray-500">
              Manage hotels, villas and resorts
            </p>
          </Link>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Rooms
            </h2>

            <p className="mt-2 text-gray-500">
              Coming Soon
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Bookings
            </h2>

            <p className="mt-2 text-gray-500">
              Coming Soon
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 p-6 text-white shadow hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
