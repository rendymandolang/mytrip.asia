"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { compressImageForUpload } from "@/lib/imageCompression";

const MAX_MEDIA_IMAGE_BYTES = 4.5 * 1024 * 1024;

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [target, setTarget] = useState("property");
  const [targetId, setTargetId] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("gallery");
  const [altText, setAltText] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      let mediaUrl = url.trim();
      let mediaType = "IMAGE";

      if (file) {
        const upload = await uploadFile(file);
        mediaUrl = upload.url;
        mediaType = upload.mediaType || "IMAGE";
      }

      if (!mediaUrl) {
        alert("Please choose a file or enter a media URL");
        return;
      }

      const body: any = {
        url: mediaUrl,
        mediaType,
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

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message || "Failed to save media",
        );
      }

      setUrl("");
      setFile(null);
      setAltText("");
      setSortOrder("0");
      await loadData();
      alert("Media saved");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save media",
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(selectedFile: File) {
    setUploading(true);

    try {
      const uploadFile =
        await compressImageForUpload(selectedFile, {
          maxBytes: MAX_MEDIA_IMAGE_BYTES,
          maxDimension: 1920,
        });
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/uploads/media", {
        method: "POST",
        headers: headers(),
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Upload failed",
        );
      }

      return data;
    } finally {
      setUploading(false);
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
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
            type="text"
            placeholder="Image or video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded border p-3 md:col-span-2"
          />

          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 md:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Upload from device
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="w-full rounded bg-white p-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG, WEBP max 5MB. MP4, WEBM, MOV
              max 30MB.
            </p>
          </div>

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
            disabled={loading || uploading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading || uploading
              ? "Saving..."
              : "Save Media"}
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            {item.mediaType === "VIDEO" ? (
              <video
                src={item.url}
                className="h-48 w-full object-cover"
                controls
              />
            ) : (
              <img
                src={item.url}
                alt={item.altText || "Media"}
                className="h-48 w-full object-cover"
              />
            )}
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
