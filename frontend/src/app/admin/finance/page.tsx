"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STATUSES = [
  "ALL",
  "ISSUED",
  "PARTIAL",
  "PAID",
  "VOID",
  "REFUNDED",
];

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function statusBadge(status: string) {
  const base =
    "rounded px-3 py-1 text-xs font-semibold";

  if (status === "PAID") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "PARTIAL") {
    return `${base} bg-blue-100 text-blue-700`;
  }

  if (status === "VOID" || status === "REFUNDED") {
    return `${base} bg-slate-200 text-slate-600`;
  }

  return `${base} bg-amber-100 text-amber-700`;
}

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [status, setStatus] = useState("ALL");
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinance();
  }, [status]);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(
        "token",
      )}`,
    };
  }

  async function loadFinance() {
    try {
      setLoading(true);
      setMessage("");

      const query =
        status === "ALL" ? "" : `?status=${status}`;

      const [summaryResponse, invoiceResponse] =
        await Promise.all([
          fetch("/api/finance/summary", {
            headers: headers(),
          }),
          fetch(`/api/finance/invoices${query}`, {
            headers: headers(),
          }),
        ]);

      if (!summaryResponse.ok || !invoiceResponse.ok) {
        throw new Error("Finance data failed to load");
      }

      setSummary(await summaryResponse.json());
      setInvoices(await invoiceResponse.json());
    } catch (error) {
      console.error(error);
      setMessage("Finance data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function createInvoice(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!bookingId.trim()) {
      return;
    }

    const response = await fetch(
      `/api/finance/bookings/${bookingId}/invoice`,
      {
        method: "POST",
        headers: headers(),
      },
    );

    if (!response.ok) {
      setMessage("Invoice could not be created");
      return;
    }

    setBookingId("");
    setMessage("Invoice created");
    await loadFinance();
  }

  async function markPaid(invoice: any) {
    const balanceDue = Number(invoice.balanceDue || 0);

    if (balanceDue <= 0) {
      return;
    }

    const confirmed = confirm(
      `Record payment ${formatCurrency(balanceDue)} for ${invoice.invoiceNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/finance/invoices/${invoice.id}/payments`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          amount: balanceDue,
          method: "BANK_TRANSFER",
          reference: `Manual payment ${new Date().toISOString()}`,
        }),
      },
    );

    if (!response.ok) {
      setMessage("Payment could not be recorded");
      return;
    }

    setMessage("Payment recorded");
    await loadFinance();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Finance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Invoices, payments and receivables
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadFinance}
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
            Total Invoices
          </div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "-" : summary?.totalInvoices || 0}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Total Amount
          </div>
          <div className="mt-1 text-xl font-bold">
            {loading
              ? "-"
              : formatCurrency(summary?.totalAmount || 0)}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Paid
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-700">
            {loading
              ? "-"
              : formatCurrency(summary?.paidAmount || 0)}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">
            Balance Due
          </div>
          <div className="mt-1 text-xl font-bold text-amber-700">
            {loading
              ? "-"
              : formatCurrency(summary?.balanceDue || 0)}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <form
          onSubmit={createInvoice}
          className="rounded-lg bg-white p-4 shadow"
        >
          <h2 className="mb-3 text-lg font-bold">
            Generate Invoice
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={bookingId}
              onChange={(event) =>
                setBookingId(event.target.value)
              }
              className="rounded border border-slate-200 px-3 py-2"
              placeholder="Booking ID"
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Create
            </button>
          </div>
        </form>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-bold">
            Invoice Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => (
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
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Invoice</th>
              <th className="p-4 text-left">Guest</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Booking</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Paid</th>
              <th className="p-4 text-left">Due</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-5 text-slate-500"
                >
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b"
                >
                  <td className="p-4 font-semibold">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="p-4">
                    {invoice.booking?.guest?.fullName ||
                      invoice.booking?.user?.fullName ||
                      "-"}
                  </td>
                  <td className="p-4">
                    {invoice.booking?.room?.property
                      ?.name || "-"}
                  </td>
                  <td className="p-4">
                    #{invoice.bookingId}
                  </td>
                  <td className="p-4">
                    <span
                      className={statusBadge(
                        invoice.status,
                      )}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {formatCurrency(
                      Number(invoice.totalAmount || 0),
                    )}
                  </td>
                  <td className="p-4">
                    {formatCurrency(
                      Number(invoice.paidAmount || 0),
                    )}
                  </td>
                  <td className="p-4">
                    {formatCurrency(
                      Number(invoice.balanceDue || 0),
                    )}
                  </td>
                  <td className="p-4">
                    {Number(invoice.balanceDue || 0) >
                    0 ? (
                      <button
                        type="button"
                        onClick={() => markPaid(invoice)}
                        className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Settled
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
