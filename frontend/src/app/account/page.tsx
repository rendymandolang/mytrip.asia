"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatCurrency(value: string | number | null) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function dateOnly(value: string) {
  return new Date(value).toLocaleDateString();
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

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(
        (booking) => booking.status === "PENDING",
      ).length,
      confirmed: bookings.filter(
        (booking) => booking.status === "CONFIRMED",
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "COMPLETED",
      ).length,
    };
  }, [bookings]);

  useEffect(() => {
    loadAccount();
  }, []);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadAccount() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const [profileResponse, bookingsResponse] =
        await Promise.all([
          fetch("/api/auth/profile", {
            headers: headers(),
          }),
          fetch("/api/account/bookings", {
            headers: headers(),
          }),
        ]);

      if (!profileResponse.ok || !bookingsResponse.ok) {
        throw new Error("Account data failed to load");
      }

      const profileData = await profileResponse.json();

      if (profileData.role !== "CUSTOMER") {
        router.replace(
          profileData.role === "OWNER"
            ? "/owner"
            : "/admin",
        );
        return;
      }

      setProfile(profileData);
      setFullName(profileData.fullName || "");
      setPhone(profileData.phone || "");
      setAvatarUrl(profileData.avatarUrl || "");
      setBio(profileData.bio || "");
      setBookings(await bookingsResponse.json());
    } catch (error) {
      console.error(error);
      setMessage("Account data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          fullName,
          phone,
          avatarUrl,
          bio,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      const updatedProfile = await response.json();
      localStorage.setItem(
        "user",
        JSON.stringify(updatedProfile),
      );
      setProfile(updatedProfile);
      setMessage("Profile updated");
    } catch {
      setMessage("Profile could not be updated");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            My Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Profile, bookings, and MYTRIP order history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Search Properties
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
          {message}
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Metric label="Orders" value={loading ? "-" : stats.total} />
        <Metric label="Pending" value={loading ? "-" : stats.pending} />
        <Metric
          label="Confirmed"
          value={loading ? "-" : stats.confirmed}
        />
        <Metric
          label="Completed"
          value={loading ? "-" : stats.completed}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={saveProfile}
          className="rounded-lg bg-white p-5 shadow"
        >
          <h2 className="mb-4 text-xl font-bold">
            Profile
          </h2>

          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-2xl font-bold text-slate-500">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              fullName.slice(0, 1).toUpperCase() || "U"
            )}
          </div>

          <div className="space-y-3">
            <input
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              placeholder="Full name"
              required
            />
            <input
              value={profile?.email || ""}
              className="w-full rounded border border-slate-200 bg-slate-100 p-3"
              disabled
            />
            <input
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              placeholder="Phone"
            />
            <input
              value={avatarUrl}
              onChange={(event) =>
                setAvatarUrl(event.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              placeholder="Avatar URL"
            />
            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              rows={4}
              placeholder="Bio"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-blue-600 p-3 font-semibold text-white disabled:bg-slate-400"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>

        <div className="rounded-lg bg-white p-5 shadow">
          <h2 className="mb-4 text-xl font-bold">
            Booking History
          </h2>

          {bookings.length === 0 ? (
            <div className="rounded bg-slate-50 p-5 text-slate-500">
              No bookings yet.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">
                        Booking #{booking.id}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {booking.room?.property?.name || "-"} -{" "}
                        {booking.room?.name || "-"}
                      </div>
                    </div>
                    <span
                      className={statusBadge(
                        booking.status,
                      )}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <div>
                      Check-in: {dateOnly(booking.checkIn)}
                    </div>
                    <div>
                      Check-out: {dateOnly(booking.checkOut)}
                    </div>
                    <div>
                      Total: {formatCurrency(booking.totalAmount)}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    Invoice: {booking.invoice?.status || "-"} / Balance:{" "}
                    {formatCurrency(
                      booking.invoice?.balanceDue || 0,
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="text-sm text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}
