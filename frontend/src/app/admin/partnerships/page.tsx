"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function statusBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "APPROVED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "REJECTED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  return `${base} bg-amber-100 text-amber-700`;
}

export default function PartnershipsPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, [status]);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadPartners() {
    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams({
        role: "OWNER",
      });

      if (status !== "ALL") {
        params.set("accountStatus", status);
      }

      const response = await fetch(
        `/api/admin-users?${params.toString()}`,
        { headers: headers() },
      );

      if (!response.ok) {
        throw new Error();
      }

      setPartners(await response.json());
    } catch {
      setMessage("Partnership registrations could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function reviewPartner(
    partnerId: number,
    action: "approve" | "reject",
  ) {
    const reviewNote =
      action === "approve"
        ? "Partner registration approved"
        : prompt("Reason for rejection?") || "";

    if (action === "reject" && !reviewNote.trim()) {
      alert("Rejection reason is required");
      return;
    }

    const response = await fetch(
      `/api/admin-users/${partnerId}/${action}`,
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

    setMessage("Partnership registration updated");
    await loadPartners();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Partnership Registration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Approve or reject property owner account
            requests.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            User Management
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

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap gap-2">
          {[
            "PENDING",
            "APPROVED",
            "REJECTED",
            "SUSPENDED",
            "ALL",
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded px-4 py-2 text-sm font-semibold ${
                status === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow">
            Loading partnerships...
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-slate-500 shadow">
            No partnership registrations found.
          </div>
        ) : (
          partners.map((partner) => (
            <div
              key={partner.id}
              className="rounded-lg bg-white p-5 shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">
                    {partner.fullName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {partner.email}{" "}
                    {partner.phone
                      ? `- ${partner.phone}`
                      : ""}
                  </div>
                  <div className="mt-3">
                    <span
                      className={statusBadge(
                        partner.accountStatus,
                      )}
                    >
                      {partner.accountStatus}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    Registered:{" "}
                    {new Date(
                      partner.createdAt,
                    ).toLocaleString()}
                  </div>
                  {partner.accountReviewNote && (
                    <div className="mt-2 text-sm text-slate-600">
                      Note: {partner.accountReviewNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {partner.accountStatus !==
                    "APPROVED" && (
                    <button
                      type="button"
                      onClick={() =>
                        reviewPartner(
                          partner.id,
                          "approve",
                        )
                      }
                      className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                  )}
                  {partner.accountStatus !==
                    "REJECTED" && (
                    <button
                      type="button"
                      onClick={() =>
                        reviewPartner(
                          partner.id,
                          "reject",
                        )
                      }
                      className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
