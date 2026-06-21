"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tower, setTower] = useState("");
  const [floor, setFloor] = useState("");
  const [electricityWatt, setElectricityWatt] =
    useState("");
  const [unitFacilities, setUnitFacilities] =
    useState("");
  const [gallery, setGallery] = useState("");
  const [additionalInfo, setAdditionalInfo] =
    useState("");
  const [housekeepingStatus, setHousekeepingStatus] =
    useState("CLEAN");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    loadProperties();
    loadRoomTypes();
  }, []);

  async function loadRooms() {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/rooms", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setRooms(data);
  }

  async function loadProperties() {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/properties", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setProperties(data);
  }

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

  function linesToArray(value: string) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function arrayToLines(value: any) {
    return Array.isArray(value) ? value.join("\n") : "";
  }

  function resetForm() {
    setEditingId(null);

    setPropertyId("");
    setRoomTypeId("");
    setName("");
    setPrice("");
    setCapacity("");
    setTower("");
    setFloor("");
    setElectricityWatt("");
    setUnitFacilities("");
    setGallery("");
    setAdditionalInfo("");
    setHousekeepingStatus("CLEAN");
    setDescription("");
  }

  async function createRoom(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "/api/rooms",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId:
              Number(propertyId),
            roomTypeId: roomTypeId
              ? Number(roomTypeId)
              : null,
            name,
            price,
            capacity:
              Number(capacity),
            tower,
            floor,
            electricityWatt,
            unitFacilities:
              linesToArray(unitFacilities),
            gallery: linesToArray(gallery),
            additionalInfo,
            housekeepingStatus,
            description,
          }),
        },
      );

      if (!response.ok) {
        throw new Error();
      }

      resetForm();
      await loadRooms();

      alert(
        "Room created successfully",
      );
    } catch {
      alert(
        "Failed to create room",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateRoom(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!editingId) return;

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `/api/rooms/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId:
              Number(propertyId),
            roomTypeId: roomTypeId
              ? Number(roomTypeId)
              : null,
            name,
            price,
            capacity:
              Number(capacity),
            tower,
            floor,
            electricityWatt,
            unitFacilities:
              linesToArray(unitFacilities),
            gallery: linesToArray(gallery),
            additionalInfo,
            housekeepingStatus,
            description,
          }),
        },
      );

      if (!response.ok) {
        throw new Error();
      }

      resetForm();
      await loadRooms();

      alert(
        "Room updated successfully",
      );
    } catch {
      alert(
        "Failed to update room",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(
    id: number,
  ) {
    if (
      !confirm(
        "Delete this room?",
      )
    ) {
      return;
    }

    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `/api/rooms/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      alert(
        "Failed to delete room",
      );
      return;
    }

    await loadRooms();

    alert(
      "Room deleted successfully",
    );
  }

  function editRoom(room: any) {
    setEditingId(room.id);

    setPropertyId(
      String(room.propertyId),
    );

    setRoomTypeId(
      room.roomTypeId ? String(room.roomTypeId) : "",
    );

    setName(room.name || "");

    setPrice(
      String(room.price || ""),
    );

    setCapacity(
      String(room.capacity || ""),
    );

    setTower(room.tower || "");
    setFloor(room.floor || "");
    setElectricityWatt(
      room.electricityWatt
        ? String(room.electricityWatt)
        : "",
    );
    setUnitFacilities(
      arrayToLines(room.unitFacilities),
    );
    setGallery(arrayToLines(room.gallery));
    setAdditionalInfo(room.additionalInfo || "");
    setHousekeepingStatus(
      room.housekeepingStatus || "CLEAN",
    );

    setDescription(
      room.description || "",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Room Management
        </h1>

        <div className="flex gap-2">
          <Link
            href="/admin/room-types"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Room Types
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
            ? "Edit Room"
            : "Add Room"}
        </h2>

        <form
          onSubmit={
            editingId
              ? updateRoom
              : createRoom
          }
          className="grid gap-4 md:grid-cols-2"
        >
          <select
            value={propertyId}
            onChange={(e) =>
              setPropertyId(
                e.target.value,
              )
            }
            className="rounded border p-3"
            required
          >
            <option value="">
              Select Property
            </option>

            {properties.map(
              (property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>
              ),
            )}
          </select>

          <select
            value={roomTypeId}
            onChange={(e) =>
              setRoomTypeId(e.target.value)
            }
            className="rounded border p-3"
          >
            <option value="">
              Select Room Type
            </option>

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
                  {roomType.property?.name} -{" "}
                  {roomType.name}
                  {roomType.bedroomType
                    ? ` (${roomType.bedroomType})`
                    : ""}
                </option>
              ))}
          </select>

          <input
            type="text"
            placeholder="Room Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value,
              )
            }
            className="rounded border p-3"
            required
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value,
              )
            }
            className="rounded border p-3"
            required
          />

          <input
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) =>
              setCapacity(
                e.target.value,
              )
            }
            className="rounded border p-3"
            required
          />

          <input
            type="text"
            placeholder="Tower / building"
            value={tower}
            onChange={(e) =>
              setTower(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Floor"
            value={floor}
            onChange={(e) =>
              setFloor(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="number"
            placeholder="Electricity watt"
            value={electricityWatt}
            onChange={(e) =>
              setElectricityWatt(e.target.value)
            }
            className="rounded border p-3"
          />

          <select
            value={housekeepingStatus}
            onChange={(e) =>
              setHousekeepingStatus(e.target.value)
            }
            className="rounded border p-3"
          >
            <option value="CLEAN">CLEAN</option>
            <option value="DIRTY">DIRTY</option>
            <option value="INSPECTING">
              INSPECTING
            </option>
            <option value="OUT_OF_SERVICE">
              OUT OF SERVICE
            </option>
          </select>

          <textarea
            rows={4}
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value,
              )
            }
            className="rounded border p-3 md:col-span-2"
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
            onChange={(e) =>
              setGallery(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            rows={4}
            placeholder="Additional information"
            value={additionalInfo}
            onChange={(e) =>
              setAdditionalInfo(e.target.value)
            }
            className="rounded border p-3 md:col-span-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update Room"
              : "Save Room"}
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
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">
                ID
              </th>
              <th className="p-4 text-left">
                Property
              </th>
              <th className="p-4 text-left">
                Room
              </th>
              <th className="p-4 text-left">
                Type
              </th>
              <th className="p-4 text-left">
                Tower / Floor
              </th>
              <th className="p-4 text-left">
                Price
              </th>
              <th className="p-4 text-left">
                Capacity
              </th>
              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                className="border-b"
              >
                <td className="p-4">
                  {room.id}
                </td>

                <td className="p-4">
                  {room.property?.name}
                </td>

                <td className="p-4">
                  {room.name}
                </td>

                <td className="p-4">
                  {room.roomType?.name || "-"}
                </td>

                <td className="p-4">
                  {[room.tower, room.floor]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </td>

                <td className="p-4">
                  Rp{" "}
                  {Number(
                    room.price,
                  ).toLocaleString()}
                </td>

                <td className="p-4">
                  <div>{room.capacity}</div>
                  <div className="text-xs text-slate-500">
                    {room.electricityWatt
                      ? `${room.electricityWatt} W`
                      : ""}
                  </div>
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        editRoom(
                          room,
                        )
                      }
                      className="rounded bg-amber-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteRoom(
                          room.id,
                        )
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
