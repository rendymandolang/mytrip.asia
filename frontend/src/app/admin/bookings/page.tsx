"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] =
    useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const token =
      localStorage.getItem("token");

    const response = await fetch(
      "/api/bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data =
      await response.json();

    setBookings(data);
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

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">
                ID
              </th>

              <th className="p-4 text-left">
                Guest
              </th>

              <th className="p-4 text-left">
                Property
              </th>

              <th className="p-4 text-left">
                Room
              </th>

              <th className="p-4 text-left">
                Check In
              </th>

              <th className="p-4 text-left">
                Check Out
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {bookings.map(
              (booking) => (
                <tr
                  key={booking.id}
                  className="border-b"
                >
                  <td className="p-4">
                    {booking.id}
                  </td>

                  <td className="p-4">
                    {
                      booking.user
                        ?.fullName
                    }
                  </td>

                  <td className="p-4">
                    {
                      booking.room
                        ?.property
                        ?.name
                    }
                  </td>

                  <td className="p-4">
                    {
                      booking.room
                        ?.name
                    }
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
                    {booking.status}
                  </td>

                  <td className="p-4">
                    Rp{" "}
                    {Number(
                      booking.totalAmount,
                    ).toLocaleString()}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
