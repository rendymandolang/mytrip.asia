"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const statuses = [
  "PENDING_REVIEW",
  "DRAFT",
  "APPROVED",
  "REJECTED",
  "ALL",
];

function statusBadge(status: string) {
  const base = "rounded px-3 py-1 text-xs font-semibold";

  if (status === "APPROVED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "REJECTED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  if (status === "PENDING_REVIEW") {
    return `${base} bg-amber-100 text-amber-700`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}

export default function PropertyApprovalsPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadProperties();
  }, [status]);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadProperties() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/properties/review-requests/list?status=${status}`,
        {
          headers: headers(),
        },
      );

      if (!response.ok) {
        throw new Error();
      }

      setProperties(await response.json());
    } catch {
      setMessage("Property review requests could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function reviewProperty(
    propertyId: number,
    action: "approve" | "reject",
  ) {
    const reviewNote =
      action === "approve"
        ? prompt("Approval note?", "Property approved") ||
          "Property approved"
        : prompt("Reason for rejection?") || "";

    if (action === "reject" && !reviewNote.trim()) {
      alert("Rejection reason is required");
      return;
    }

    const response = await fetch(
      `/api/properties/${propertyId}/${action}`,
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

    setMessage("Property review updated");
    await loadProperties();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Property Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review partner property submissions before
            publishing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/properties"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Property Catalog
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
          {statuses.map((item) => (
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
            Loading property reviews...
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-slate-500 shadow">
            No property review requests found.
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              className="rounded-lg bg-white p-5 shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">
                      {property.name}
                    </h2>
                    <span
                      className={statusBadge(
                        property.approvalStatus ||
                          "DRAFT",
                      )}
                    >
                      {property.approvalStatus || "DRAFT"}
                    </span>
                    <span
                      className={
                        property.isPublished
                          ? "rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      }
                    >
                      {property.isPublished
                        ? "Published"
                        : "Not Published"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    {property.propertyType} -{" "}
                    {property.destination?.displayName ||
                      property.city ||
                      "-"}
                    {property.country
                      ? `, ${property.country}`
                      : ""}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    Owner:{" "}
                    {property.owner?.fullName ||
                      property.ownerId ||
                      "-"}{" "}
                    {property.owner?.email
                      ? `(${property.owner.email})`
                      : ""}
                  </div>

                  {property.fullAddress ||
                  property.address ? (
                    <div className="mt-2 text-sm text-slate-600">
                      Address:{" "}
                      {property.fullAddress ||
                        property.address}
                    </div>
                  ) : null}

                  {property.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                      {property.description}
                    </p>
                  )}

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
                    <div className="rounded bg-slate-50 p-3">
                      Room Types:{" "}
                      <strong>
                        {property.roomTypes?.length || 0}
                      </strong>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      Rooms:{" "}
                      <strong>
                        {property.rooms?.length || 0}
                      </strong>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      Terms:{" "}
                      <strong>
                        {(
                          property.supportedRentalTerms ||
                          []
                        ).join(", ") || "-"}
                      </strong>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      Submitted:{" "}
                      <strong>
                        {property.submittedAt
                          ? new Date(
                              property.submittedAt,
                            ).toLocaleDateString()
                          : "-"}
                      </strong>
                    </div>
                  </div>

                  {property.approvalNote && (
                    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      Note: {property.approvalNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {property.approvalStatus !==
                    "APPROVED" && (
                    <button
                      type="button"
                      onClick={() =>
                        reviewProperty(
                          property.id,
                          "approve",
                        )
                      }
                      className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                  )}
                  {property.approvalStatus !==
                    "REJECTED" && (
                    <button
                      type="button"
                      onClick={() =>
                        reviewProperty(
                          property.id,
                          "reject",
                        )
                      }
                      className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Reject
                    </button>
                  )}
                  <Link
                    href="/admin/properties"
                    className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Catalog
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
