"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [target, setTarget] = useState("property");
  const [targetId, setTargetId] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("gallery");
  const [altText, setAltText] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function headers() {
    return {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function loadData() {
    const [mediaRes, propertyRes, roomTypeRes, roomRes] =
      await Promise.all([
        fetch("/api/media", { headers: headers() }),
        fetch("/api/properties", { headers: headers() }),
        fetch("/api/room-types", { headers: headers() }),
        fetch("/api/rooms", { headers: headers() }),
      ]);

    if (mediaRes.ok) setMedia(await mediaRes.json());
    if (propertyRes.ok)
      setProperties(await propertyRes.json());
    if (roomTypeRes.ok)
      setRoomTypes(await roomTypeRes.json());
    if (roomRes.ok) setRooms(await roomRes.json());
  }

  function options() {
    if (target === "roomType") {
      return roomTypes.map((item) => ({
        id: item.id,
        label: `${item.property?.name || "-"} - ${item.name}`,
      }));
    }

    if (target === "room") {
      return rooms.map((item) => ({
        id: item.id,
        label: `${item.property?.name || "-"} - ${item.name}`,
      }));
    }

    return properties.map((item) => ({
      id: item.id,
      label: item.name,
    }));
  }

  async function saveMedia(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      const body: any = {
        url,
        mediaType: "IMAGE",
        category,
        altText,
        sortOrder,
      };

      if (target === "roomType") {
        body.roomTypeId = Number(targetId);
      } else if (target === "room") {
        body.roomId = Number(targetId);
      } else {
        body.propertyId = Number(targetId);
      }

      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error();

      setUrl("");
      setAltText("");
      setSortOrder("0");
      await loadData();
      alert("Media saved");
    } catch {
      alert("Failed to save media");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMedia(id: number) {
    if (!confirm("Delete this media?")) return;

    const response = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: headers(),
    });

    if (!response.ok) {
      alert("Failed to delete media");
      return;
    }

    await loadData();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Media Manager
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
          onSubmit={saveMedia}
          className="grid gap-4 md:grid-cols-3"
        >
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setTargetId("");
            }}
            className="rounded border p-3"
          >
            <option value="property">Property</option>
            <option value="roomType">Room Type</option>
            <option value="room">Room</option>
          </select>

          <select
            value={targetId}
            onChange={(e) =>
              setTargetId(e.target.value)
            }
            className="rounded border p-3"
            required
          >
            <option value="">Select target</option>
            {options().map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="url"
            placeholder="Image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded border p-3 md:col-span-2"
            required
          />

          <input
            type="number"
            placeholder="Sort order"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Alt text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="rounded border p-3 md:col-span-2"
          />

          <button
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading ? "Saving..." : "Save Media"}
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <img
              src={item.url}
              alt={item.altText || "Media"}
              className="h-48 w-full object-cover"
            />
            <div className="p-4">
              <div className="font-semibold">
                {item.property?.name ||
                  item.roomType?.name ||
                  item.room?.name ||
                  "Media"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {item.category || "gallery"} /{" "}
                {item.mediaType}
              </div>
              <button
                onClick={() => deleteMedia(item.id)}
                className="mt-3 rounded bg-red-600 px-3 py-1 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
