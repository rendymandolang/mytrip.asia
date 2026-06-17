"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState("");
  const [propertyType, setPropertyType] =
    useState("HOTEL");
  const [city, setCity] = useState("");
  const [country, setCountry] =
    useState("Indonesia");
  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "/api/properties",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json();

      setProperties(data);
    } catch (error) {
      console.error(error);
    }
  }

  function resetForm() {
    setEditingId(null);

    setName("");
    setPropertyType("HOTEL");
    setCity("");
    setCountry("Indonesia");
    setDescription("");
  }

  async function createProperty(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "/api/properties",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            propertyType,
            city,
            country,
            description,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create property",
        );
      }

      resetForm();

      await loadProperties();

      alert(
        "Property created successfully",
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to create property",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateProperty(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!editingId) return;

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `/api/properties/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            propertyType,
            city,
            country,
            description,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update property",
        );
      }

      resetForm();

      await loadProperties();

      alert(
        "Property updated successfully",
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update property",
      );
    } finally {
      setLoading(false);
    }
  }

  function editProperty(property: any) {
    setEditingId(property.id);

    setName(property.name || "");

    setPropertyType(
      property.propertyType || "HOTEL",
    );

    setCity(property.city || "");

    setCountry(
      property.country || "Indonesia",
    );

    setDescription(
      property.description || "",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteProperty(
    id: number,
  ) {
    const confirmed = confirm(
      "Delete this property?",
    );

    if (!confirmed) return;

    try {
      const token =
        localStorage.getItem("token");

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
        throw new Error(
          "Failed to delete property",
        );
      }

      await loadProperties();

      alert(
        "Property deleted successfully",
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete property",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Property Management
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
          {editingId
            ? "Edit Property"
            : "Add Property"}
        </h2>

        <form
          onSubmit={
            editingId
              ? updateProperty
              : createProperty
          }
          className="grid gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Property Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="rounded border p-3"
            required
          />

          <select
            value={propertyType}
            onChange={(e) =>
              setPropertyType(
                e.target.value,
              )
            }
            className="rounded border p-3"
          >
            <option value="HOTEL">
              HOTEL
            </option>
            <option value="VILLA">
              VILLA
            </option>
            <option value="RESORT">
              RESORT
            </option>
            <option value="APARTMENT">
              APARTMENT
            </option>
            <option value="HOMESTAY">
              HOMESTAY
            </option>
          </select>

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            className="rounded border p-3"
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            className="rounded border p-3"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value,
              )
            }
            className="rounded border p-3 md:col-span-2"
            rows={4}
          />

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

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4 text-left">
                ID
              </th>
              <th className="p-4 text-left">
                Name
              </th>
              <th className="p-4 text-left">
                Type
              </th>
              <th className="p-4 text-left">
                City
              </th>
              <th className="p-4 text-left">
                Country
              </th>
              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {properties.map(
              (property) => (
                <tr
                  key={property.id}
                  className="border-b"
                >
                  <td className="p-4">
                    {property.id}
                  </td>

                  <td className="p-4">
                    {property.name}
                  </td>

                  <td className="p-4">
                    {
                      property.propertyType
                    }
                  </td>

                  <td className="p-4">
                    {property.city}
                  </td>

                  <td className="p-4">
                    {property.country}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editProperty(
                            property,
                          )
                        }
                        className="rounded bg-amber-500 px-3 py-1 text-white"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteProperty(
                            property.id,
                          )
                        }
                        className="rounded bg-red-600 px-3 py-1 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
