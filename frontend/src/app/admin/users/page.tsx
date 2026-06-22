"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const roles = [
  "ALL",
  "CUSTOMER",
  "OWNER",
  "ADMIN",
  "FINANCE_HEAD",
  "SUPERADMIN",
];

const statuses = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
];

function statusBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "APPROVED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "REJECTED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  if (status === "SUSPENDED") {
    return `${base} bg-slate-200 text-slate-700`;
  }

  return `${base} bg-amber-100 text-amber-700`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [role, setRole] = useState("ALL");
  const [accountStatus, setAccountStatus] =
    useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredSummary = useMemo(() => {
    return {
      pending: users.filter(
        (user) => user.accountStatus === "PENDING",
      ).length,
      customers: users.filter(
        (user) => user.role === "CUSTOMER",
      ).length,
      partners: users.filter(
        (user) => user.role === "OWNER",
      ).length,
    };
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [role, accountStatus]);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadUsers(event?: React.FormEvent) {
    event?.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams();

      if (role !== "ALL") params.set("role", role);
      if (accountStatus !== "ALL") {
        params.set("accountStatus", accountStatus);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const [statsResponse, usersResponse] =
        await Promise.all([
          fetch("/api/admin-users/stats", {
            headers: headers(),
          }),
          fetch(
            `/api/admin-users?${params.toString()}`,
            { headers: headers() },
          ),
        ]);

      if (!statsResponse.ok || !usersResponse.ok) {
        throw new Error("User data failed to load");
      }

      setStats(await statsResponse.json());
      setUsers(await usersResponse.json());
    } catch (error) {
      console.error(error);
      setMessage("User management data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function reviewUser(
    userId: number,
    action: "approve" | "reject" | "suspend" | "pending",
  ) {
    const reviewNote =
      action === "approve"
        ? "Approved by admin"
        : prompt("Review note?") || "";

    if (action !== "approve" && !reviewNote.trim()) {
      alert("Review note is required");
      return;
    }

    const response = await fetch(
      `/api/admin-users/${userId}/${action}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          reviewNote,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.message || "Review failed");
      return;
    }

    setMessage("User status updated");
    await loadUsers();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review customer, partner, and staff accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/partnerships"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Partnerships
          </Link>
          <Link
            href="/admin"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
        <Metric
          label="Total Users"
          value={loading ? "-" : stats?.total || 0}
        />
        <Metric
          label="Pending"
          value={loading ? "-" : filteredSummary.pending}
        />
        <Metric
          label="Customers"
          value={loading ? "-" : filteredSummary.customers}
        />
        <Metric
          label="Partners"
          value={loading ? "-" : filteredSummary.partners}
        />
      </div>

      <form
        onSubmit={loadUsers}
        className="mb-6 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded border border-slate-200 p-3"
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={accountStatus}
          onChange={(event) =>
            setAccountStatus(event.target.value)
          }
          className="rounded border border-slate-200 p-3"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="rounded border border-slate-200 p-3"
          placeholder="Search name, email, phone"
        />

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-3 font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Activity</th>
              <th className="p-4 text-left">Review Note</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-5 text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b"
                >
                  <td className="p-4">
                    <div className="font-semibold">
                      {user.fullName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">{user.role}</td>
                  <td className="p-4">
                    <span
                      className={statusBadge(
                        user.accountStatus,
                      )}
                    >
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.phone || "-"}
                  </td>
                  <td className="p-4 text-sm">
                    {user._count?.bookings || 0} bookings
                    <br />
                    {user._count?.ownedProperties || 0} properties
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {user.accountReviewNote || "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {user.accountStatus !==
                        "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            reviewUser(
                              user.id,
                              "approve",
                            )
                          }
                          className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>
                      )}
                      {user.accountStatus !==
                        "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            reviewUser(
                              user.id,
                              "reject",
                            )
                          }
                          className="rounded bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Reject
                        </button>
                      )}
                      {user.accountStatus !==
                        "SUSPENDED" && (
                        <button
                          type="button"
                          onClick={() =>
                            reviewUser(
                              user.id,
                              "suspend",
                            )
                          }
                          className="rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
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
