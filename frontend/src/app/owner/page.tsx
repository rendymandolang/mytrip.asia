"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function arrayToLines(value: any) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OwnerPortalPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [propertyFacilities, setPropertyFacilities] =
    useState("");
  const [buildingFacilities, setBuildingFacilities] =
    useState("");
  const [additionalInfo, setAdditionalInfo] =
    useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "OWNER") {
        router.push("/admin");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    loadProperties();
  }, []);

  function headers() {
    return {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function loadProperties() {
    const response = await fetch("/api/owner/properties", {
      headers: headers(),
    });

    if (response.ok) {
      const data = await response.json();
      setProperties(data);
      if (data[0]) {
        selectProperty(data[0]);
      }
    }
  }

  function selectProperty(property: any) {
    setSelected(property);
    setDescription(property.description || "");
    setAddress(property.address || "");
    setFullAddress(property.fullAddress || "");
    setPropertyFacilities(
      arrayToLines(property.propertyFacilities),
    );
    setBuildingFacilities(
      arrayToLines(property.buildingFacilities),
    );
    setAdditionalInfo(property.additionalInfo || "");
  }

  async function saveProperty(e: React.FormEvent) {
    e.preventDefault();

    if (!selected) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/owner/properties/${selected.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...headers(),
          },
          body: JSON.stringify({
            description,
            address,
            fullAddress,
            propertyFacilities:
              linesToArray(propertyFacilities),
            buildingFacilities:
              linesToArray(buildingFacilities),
            additionalInfo,
          }),
        },
      );

      if (!response.ok) throw new Error();

      await loadProperties();
      alert("Property updated");
    } catch {
      alert("Failed to update property");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Owner Portal
        </h1>
        <Link
          href="/"
          className="rounded bg-slate-900 px-4 py-2 text-white"
        >
          Public Site
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-bold">
            My Properties
          </h2>

          {properties.length === 0 ? (
            <p className="text-sm text-slate-500">
              No property assigned yet.
            </p>
          ) : (
            <div className="space-y-2">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() =>
                    selectProperty(property)
                  }
                  className={`w-full rounded p-3 text-left ${
                    selected?.id === property.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="font-semibold">
                    {property.name}
                  </div>
                  <div className="text-xs opacity-80">
                    {property.city || "-"} /{" "}
                    {property.propertyType}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric
                label="Room Types"
                value={selected.roomTypes?.length || 0}
              />
              <Metric
                label="Rooms"
                value={selected.rooms?.length || 0}
              />
              <Metric
                label="Pricing Rules"
                value={
                  selected.pricingRules?.length || 0
                }
              />
              <Metric
                label="Media"
                value={selected.mediaAssets?.length || 0}
              />
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold">
                Edit Property Information
              </h2>

              <form
                onSubmit={saveProperty}
                className="grid gap-4"
              >
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Description"
                  className="rounded border p-3"
                />

                <input
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="Short address"
                  className="rounded border p-3"
                />

                <textarea
                  rows={3}
                  value={fullAddress}
                  onChange={(e) =>
                    setFullAddress(e.target.value)
                  }
                  placeholder="Full address"
                  className="rounded border p-3"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <textarea
                    rows={5}
                    value={propertyFacilities}
                    onChange={(e) =>
                      setPropertyFacilities(
                        e.target.value,
                      )
                    }
                    placeholder="Property facilities, one per line"
                    className="rounded border p-3"
                  />

                  <textarea
                    rows={5}
                    value={buildingFacilities}
                    onChange={(e) =>
                      setBuildingFacilities(
                        e.target.value,
                      )
                    }
                    placeholder="Building facilities, one per line"
                    className="rounded border p-3"
                  />
                </div>

                <textarea
                  rows={4}
                  value={additionalInfo}
                  onChange={(e) =>
                    setAdditionalInfo(e.target.value)
                  }
                  placeholder="Additional information"
                  className="rounded border p-3"
                />

                <button
                  disabled={loading}
                  className="w-fit rounded bg-green-600 px-6 py-3 text-white"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
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
