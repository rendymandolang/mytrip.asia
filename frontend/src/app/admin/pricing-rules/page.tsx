"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const rentalTerms = ["DAILY", "MONTHLY", "YEARLY"];

export default function PricingRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [rentalTerm, setRentalTerm] = useState("DAILY");
  const [basePrice, setBasePrice] = useState("");
  const [serviceFee, setServiceFee] = useState("0");
  const [cleaningFee, setCleaningFee] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [minStay, setMinStay] = useState("");
  const [maxStay, setMaxStay] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function authHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function loadData() {
    const headers = await authHeaders();
    const [rulesRes, propertiesRes, roomTypesRes] =
      await Promise.all([
        fetch("/api/pricing-rules", { headers }),
        fetch("/api/properties", { headers }),
        fetch("/api/room-types", { headers }),
      ]);

    if (rulesRes.ok) setRules(await rulesRes.json());
    if (propertiesRes.ok)
      setProperties(await propertiesRes.json());
    if (roomTypesRes.ok)
      setRoomTypes(await roomTypesRes.json());
  }

  function resetForm() {
    setEditingId(null);
    setPropertyId("");
    setRoomTypeId("");
    setRentalTerm("DAILY");
    setBasePrice("");
    setServiceFee("0");
    setCleaningFee("0");
    setDeposit("0");
    setMinStay("");
    setMaxStay("");
    setActive(true);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(
        editingId
          ? `/api/pricing-rules/${editingId}`
          : "/api/pricing-rules",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({
            propertyId: Number(propertyId),
            roomTypeId: roomTypeId
              ? Number(roomTypeId)
              : null,
            rentalTerm,
            basePrice,
            serviceFee,
            cleaningFee,
            deposit,
            minStay,
            maxStay,
            active,
          }),
        },
      );

      if (!response.ok) throw new Error();

      resetForm();
      await loadData();
      alert("Pricing rule saved");
    } catch {
      alert("Failed to save pricing rule");
    } finally {
      setLoading(false);
    }
  }

  function editRule(rule: any) {
    setEditingId(rule.id);
    setPropertyId(String(rule.propertyId));
    setRoomTypeId(
      rule.roomTypeId ? String(rule.roomTypeId) : "",
    );
    setRentalTerm(rule.rentalTerm || "DAILY");
    setBasePrice(String(rule.basePrice || ""));
    setServiceFee(String(rule.serviceFee || "0"));
    setCleaningFee(String(rule.cleaningFee || "0"));
    setDeposit(String(rule.deposit || "0"));
    setMinStay(rule.minStay ? String(rule.minStay) : "");
    setMaxStay(rule.maxStay ? String(rule.maxStay) : "");
    setActive(rule.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteRule(id: number) {
    if (!confirm("Delete this pricing rule?")) return;

    const response = await fetch(
      `/api/pricing-rules/${id}`,
      {
        method: "DELETE",
        headers: await authHeaders(),
      },
    );

    if (!response.ok) {
      alert("Failed to delete pricing rule");
      return;
    }

    await loadData();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Pricing Rules
        </h1>
        <Link
          href="/admin"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Dashboard
        </Link>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <form
          onSubmit={saveRule}
          className="grid gap-4 md:grid-cols-3"
        >
          <select
            value={propertyId}
            onChange={(e) =>
              setPropertyId(e.target.value)
            }
            className="rounded border p-3"
            required
          >
            <option value="">Select property</option>
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
            value={roomTypeId}
            onChange={(e) =>
              setRoomTypeId(e.target.value)
            }
            className="rounded border p-3"
          >
            <option value="">Property default</option>
            {roomTypes
              .filter(
                (roomType) =>
                  !propertyId ||
                  String(roomType.propertyId) ===
                    propertyId,
              )
              .map((roomType) => (
                <option
                  key={roomType.id}
                  value={roomType.id}
                >
                  {roomType.name}
                </option>
              ))}
          </select>

          <select
            value={rentalTerm}
            onChange={(e) =>
              setRentalTerm(e.target.value)
            }
            className="rounded border p-3"
          >
            {rentalTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Base price"
            value={basePrice}
            onChange={(e) =>
              setBasePrice(e.target.value)
            }
            className="rounded border p-3"
            required
          />

          <input
            type="number"
            placeholder="Service fee"
            value={serviceFee}
            onChange={(e) =>
              setServiceFee(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="number"
            placeholder="Cleaning fee"
            value={cleaningFee}
            onChange={(e) =>
              setCleaningFee(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="number"
            placeholder="Deposit"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="number"
            placeholder="Min stay nights"
            value={minStay}
            onChange={(e) => setMinStay(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="number"
            placeholder="Max stay nights"
            value={maxStay}
            onChange={(e) => setMaxStay(e.target.value)}
            className="rounded border p-3"
          />

          <label className="flex items-center gap-2 rounded border p-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) =>
                setActive(e.target.checked)
              }
            />
            Active
          </label>

          <button
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Update Rule"
                : "Save Rule"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-slate-500 px-6 py-3 text-white"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Room Type</th>
              <th className="p-4 text-left">Term</th>
              <th className="p-4 text-left">Base</th>
              <th className="p-4 text-left">Fees</th>
              <th className="p-4 text-left">Stay</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b">
                <td className="p-4">
                  {rule.property?.name || "-"}
                </td>
                <td className="p-4">
                  {rule.roomType?.name || "Default"}
                </td>
                <td className="p-4">{rule.rentalTerm}</td>
                <td className="p-4">
                  Rp{" "}
                  {Number(rule.basePrice).toLocaleString(
                    "id-ID",
                  )}
                </td>
                <td className="p-4 text-sm">
                  Svc {rule.serviceFee} / Clean{" "}
                  {rule.cleaningFee} / Dep {rule.deposit}
                </td>
                <td className="p-4">
                  {rule.minStay || "-"} -{" "}
                  {rule.maxStay || "-"}
                </td>
                <td className="p-4">
                  {rule.active ? "Active" : "Off"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => editRule(rule)}
                      className="rounded bg-amber-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
