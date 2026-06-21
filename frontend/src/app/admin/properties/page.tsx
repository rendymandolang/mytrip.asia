"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const propertyTypes = [
  ["APARTMENT", "Apartment"],
  ["VILLA", "Villa"],
  ["HOTEL", "Hotel"],
  ["RESORT", "Resort"],
  ["CO_LIVING", "Co-Living"],
  ["HOMESTAY", "Homestay"],
];

const rentalTerms = [
  ["DAILY", "Daily"],
  ["MONTHLY", "Monthly"],
  ["YEARLY", "Yearly"],
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [propertyType, setPropertyType] =
    useState("APARTMENT");
  const [supportedRentalTerms, setSupportedRentalTerms] =
    useState<string[]>(["DAILY", "MONTHLY"]);
  const [destinationId, setDestinationId] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [timezone, setTimezone] =
    useState("Asia/Jakarta");
  const [currency, setCurrency] = useState("IDR");
  const [rating, setRating] = useState("0");
  const [reviewCount, setReviewCount] = useState("0");
  const [gallery, setGallery] = useState("");
  const [propertyFacilities, setPropertyFacilities] =
    useState("");
  const [buildingFacilities, setBuildingFacilities] =
    useState("");
  const [description, setDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] =
    useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProperties();
    loadDestinations();
  }, []);

  async function loadProperties() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/properties", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProperties(await response.json());
    } catch (error) {
      console.error(error);
    }
  }

  async function loadDestinations() {
    try {
      const response = await fetch(
        "/api/catalog/destinations",
      );

      if (response.ok) {
        setDestinations(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setPropertyType("APARTMENT");
    setSupportedRentalTerms(["DAILY", "MONTHLY"]);
    setDestinationId("");
    setCity("");
    setCountry("Indonesia");
    setArea("");
    setAddress("");
    setFullAddress("");
    setLatitude("");
    setLongitude("");
    setBuildingName("");
    setTimezone("Asia/Jakarta");
    setCurrency("IDR");
    setRating("0");
    setReviewCount("0");
    setGallery("");
    setPropertyFacilities("");
    setBuildingFacilities("");
    setDescription("");
    setAdditionalInfo("");
    setIsPublished(true);
  }

  function toggleRentalTerm(term: string) {
    setSupportedRentalTerms((current) => {
      if (current.includes(term)) {
        const next = current.filter(
          (item) => item !== term,
        );

        return next.length > 0 ? next : current;
      }

      return [...current, term];
    });
  }

  function updateDestination(value: string) {
    setDestinationId(value);

    const destination = destinations.find(
      (item) => String(item.id) === value,
    );

    if (destination) {
      setCity(destination.city || "");
      setCountry(destination.country || "");
      setLatitude(
        destination.latitude
          ? String(destination.latitude)
          : "",
      );
      setLongitude(
        destination.longitude
          ? String(destination.longitude)
          : "",
      );
    }
  }

  function propertyPayload() {
    return {
      name,
      slug,
      propertyType,
      supportedRentalTerms,
      destinationId: destinationId
        ? Number(destinationId)
        : null,
      city,
      country,
      area,
      address,
      fullAddress,
      latitude,
      longitude,
      buildingName,
      timezone,
      currency,
      rating,
      reviewCount: Number(reviewCount || 0),
      gallery: linesToArray(gallery),
      propertyFacilities: linesToArray(
        propertyFacilities,
      ),
      buildingFacilities: linesToArray(
        buildingFacilities,
      ),
      description,
      additionalInfo,
      isPublished,
    };
  }

  async function saveProperty(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const response = await fetch(
        editingId
          ? `/api/properties/${editingId}`
          : "/api/properties",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(propertyPayload()),
        },
      );

      if (!response.ok) {
        throw new Error("Property save failed");
      }

      resetForm();
      await loadProperties();

      alert("Property saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save property");
    } finally {
      setLoading(false);
    }
  }

  function editProperty(property: any) {
    setEditingId(property.id);
    setName(property.name || "");
    setSlug(property.slug || "");
    setPropertyType(
      property.propertyType || "APARTMENT",
    );
    setSupportedRentalTerms(
      property.supportedRentalTerms?.length
        ? property.supportedRentalTerms
        : ["DAILY"],
    );
    setDestinationId(
      property.destinationId
        ? String(property.destinationId)
        : "",
    );
    setCity(property.city || "");
    setCountry(property.country || "Indonesia");
    setArea(property.area || "");
    setAddress(property.address || "");
    setFullAddress(property.fullAddress || "");
    setLatitude(property.latitude || "");
    setLongitude(property.longitude || "");
    setBuildingName(property.buildingName || "");
    setTimezone(property.timezone || "Asia/Jakarta");
    setCurrency(property.currency || "IDR");
    setRating(String(property.rating || 0));
    setReviewCount(String(property.reviewCount || 0));
    setGallery(arrayToLines(property.gallery));
    setPropertyFacilities(
      arrayToLines(property.propertyFacilities),
    );
    setBuildingFacilities(
      arrayToLines(property.buildingFacilities),
    );
    setDescription(property.description || "");
    setAdditionalInfo(property.additionalInfo || "");
    setIsPublished(property.isPublished !== false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteProperty(id: number) {
    if (!confirm("Delete this property?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/properties/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await loadProperties();
      alert("Property deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete property");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          Property Catalog
        </h1>

        <Link
          href="/admin"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Dashboard
        </Link>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">
          {editingId ? "Edit Property" : "Add Property"}
        </h2>

        <form
          onSubmit={saveProperty}
          className="grid gap-4 lg:grid-cols-3"
        >
          <input
            type="text"
            placeholder="Property name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border p-3"
            required
          />

          <input
            type="text"
            placeholder="Slug, optional"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded border p-3"
          />

          <select
            value={propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value)
            }
            className="rounded border p-3"
          >
            {propertyTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={destinationId}
            onChange={(e) =>
              updateDestination(e.target.value)
            }
            className="rounded border p-3"
          >
            <option value="">Select destination</option>
            {destinations.map((destination) => (
              <option
                key={destination.id}
                value={destination.id}
              >
                {destination.displayName}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Area / neighborhood"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Short address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Building name"
            value={buildingName}
            onChange={(e) =>
              setBuildingName(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) =>
              setLatitude(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) =>
              setLongitude(e.target.value)
            }
            className="rounded border p-3"
          />

          <div className="flex items-center gap-3 rounded border p-3">
            <input
              id="published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) =>
                setIsPublished(e.target.checked)
              }
            />
            <label htmlFor="published">
              Published
            </label>
          </div>

          <div className="rounded border p-3 lg:col-span-3">
            <div className="mb-2 text-sm font-semibold">
              Rental terms
            </div>
            <div className="flex flex-wrap gap-2">
              {rentalTerms.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={supportedRentalTerms.includes(
                      value,
                    )}
                    onChange={() =>
                      toggleRentalTerm(value)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            placeholder="Full address"
            value={fullAddress}
            onChange={(e) =>
              setFullAddress(e.target.value)
            }
            className="rounded border p-3 lg:col-span-3"
          />

          <textarea
            rows={4}
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="rounded border p-3 lg:col-span-3"
          />

          <textarea
            rows={4}
            placeholder="Gallery URLs, one per line"
            value={gallery}
            onChange={(e) => setGallery(e.target.value)}
            className="rounded border p-3 lg:col-span-3"
          />

          <textarea
            rows={4}
            placeholder="Property facilities, one per line"
            value={propertyFacilities}
            onChange={(e) =>
              setPropertyFacilities(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            rows={4}
            placeholder="Building facilities, one per line"
            value={buildingFacilities}
            onChange={(e) =>
              setBuildingFacilities(e.target.value)
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
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Timezone"
            value={timezone}
            onChange={(e) =>
              setTimezone(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Currency"
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value)
            }
            className="rounded border p-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Rating"
              value={rating}
              onChange={(e) =>
                setRating(e.target.value)
              }
              className="rounded border p-3"
            />

            <input
              type="number"
              min="0"
              placeholder="Review count"
              value={reviewCount}
              onChange={(e) =>
                setReviewCount(e.target.value)
              }
              className="rounded border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Update Property"
                : "Save Property"}
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
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Property</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">
                Destination
              </th>
              <th className="p-4 text-left">Terms</th>
              <th className="p-4 text-left">Rating</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                className="border-b"
              >
                <td className="p-4">{property.id}</td>
                <td className="p-4">
                  <div className="font-semibold">
                    {property.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {property.slug || "-"}
                  </div>
                </td>
                <td className="p-4">
                  {property.propertyType}
                </td>
                <td className="p-4">
                  {property.destination?.displayName ||
                    property.city ||
                    "-"}
                </td>
                <td className="p-4">
                  {(
                    property.supportedRentalTerms || []
                  ).join(", ") || "-"}
                </td>
                <td className="p-4">
                  {Number(
                    property.rating || 0,
                  ).toFixed(1)}{" "}
                  ({property.reviewCount || 0})
                </td>
                <td className="p-4">
                  <span
                    className={`rounded px-3 py-1 text-sm font-semibold ${
                      property.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {property.isPublished
                      ? "Published"
                      : "Draft"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        editProperty(property)
                      }
                      className="rounded bg-amber-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        deleteProperty(property.id)
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
