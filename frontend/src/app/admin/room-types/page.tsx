"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const bedroomTypes = [
  ["STUDIO", "Studio"],
  ["ONE_BR", "1BR"],
  ["TWO_BR", "2BR"],
  ["THREE_BR_PLUS", "3BR+"],
];

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value: any) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [name, setName] = useState("");
  const [bedroomType, setBedroomType] =
    useState("ONE_BR");
  const [capacity, setCapacity] = useState("2");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [unitFacilities, setUnitFacilities] =
    useState("");
  const [gallery, setGallery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoomTypes();
    loadProperties();
  }, []);

  async function loadRoomTypes() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/room-types", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setRoomTypes(await response.json());
    }
  }

  async function loadProperties() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/properties", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setProperties(await response.json());
    }
  }

  function resetForm() {
    setEditingId(null);
    setPropertyId("");
    setName("");
    setBedroomType("ONE_BR");
    setCapacity("2");
    setBasePrice("");
    setDescription("");
    setUnitFacilities("");
    setGallery("");
  }

  async function saveRoomType(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        editingId
          ? `/api/room-types/${editingId}`
          : "/api/room-types",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId: Number(propertyId),
            name,
            bedroomType,
            capacity: Number(capacity),
            basePrice,
            description,
            unitFacilities:
              linesToArray(unitFacilities),
            gallery: linesToArray(gallery),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Room type save failed");
      }

      resetForm();
      await loadRoomTypes();
      alert("Room type saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save room type");
    } finally {
      setLoading(false);
    }
  }

  function editRoomType(roomType: any) {
    setEditingId(roomType.id);
    setPropertyId(String(roomType.propertyId));
    setName(roomType.name || "");
    setBedroomType(roomType.bedroomType || "ONE_BR");
    setCapacity(String(roomType.capacity || 2));
    setBasePrice(String(roomType.basePrice || ""));
    setDescription(roomType.description || "");
    setUnitFacilities(
      arrayToLines(roomType.unitFacilities),
    );
    setGallery(arrayToLines(roomType.gallery));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteRoomType(id: number) {
    if (!confirm("Delete this room type?")) return;

    const token = localStorage.getItem("token");
    const response = await fetch(
      `/api/room-types/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      alert("Failed to delete room type");
      return;
    }

    await loadRoomTypes();
    alert("Room type deleted successfully");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          Room Types
        </h1>

        <div className="flex gap-2">
          <Link
            href="/admin/rooms"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Rooms
          </Link>
          <Link
            href="/admin"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">
          {editingId
            ? "Edit Room Type"
            : "Add Room Type"}
        </h2>

        <form
          onSubmit={saveRoomType}
          className="grid gap-4 md:grid-cols-2"
        >
          <select
            value={propertyId}
            onChange={(e) =>
              setPropertyId(e.target.value)
            }
            className="rounded border p-3"
            required
          >
            <option value="">Select Property</option>
            {properties.map((property) => (
              <option
                key={property.id}
                value={property.id}
              >
                {property.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Room type name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border p-3"
            required
          />

          <select
            value={bedroomType}
            onChange={(e) =>
              setBedroomType(e.target.value)
            }
            className="rounded border p-3"
          >
            {bedroomTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) =>
              setCapacity(e.target.value)
            }
            className="rounded border p-3"
            required
          />

          <input
            type="number"
            placeholder="Base price"
            value={basePrice}
            onChange={(e) =>
              setBasePrice(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            rows={3}
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            rows={4}
            placeholder="Unit facilities, one per line"
            value={unitFacilities}
            onChange={(e) =>
              setUnitFacilities(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            rows={4}
            placeholder="Gallery URLs, one per line"
            value={gallery}
            onChange={(e) => setGallery(e.target.value)}
            className="rounded border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Update Room Type"
                : "Save Room Type"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-slate-500 px-6 py-3 text-white"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Bedroom</th>
              <th className="p-4 text-left">Capacity</th>
              <th className="p-4 text-left">Base Price</th>
              <th className="p-4 text-left">Rooms</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType) => (
              <tr
                key={roomType.id}
                className="border-b"
              >
                <td className="p-4">{roomType.id}</td>
                <td className="p-4">
                  {roomType.property?.name || "-"}
                </td>
                <td className="p-4">{roomType.name}</td>
                <td className="p-4">
                  {roomType.bedroomType || "-"}
                </td>
                <td className="p-4">
                  {roomType.capacity}
                </td>
                <td className="p-4">
                  {roomType.basePrice
                    ? `Rp ${Number(roomType.basePrice).toLocaleString()}`
                    : "-"}
                </td>
                <td className="p-4">
                  {roomType._count?.rooms ?? 0}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        editRoomType(roomType)
                      }
                      className="rounded bg-amber-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        deleteRoomType(roomType.id)
                      }
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
