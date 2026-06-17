"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);

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

      setName("");
      setPropertyType("HOTEL");
      setCity("");
      setCountry("Indonesia");
      setDescription("");

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
          Add Property
        </h2>

        <form
          onSubmit={createProperty}
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
            className="rounded bg-green-600 px-6 py-3 text-white md:col-span-2"
          >
            {loading
              ? "Saving..."
              : "Save Property"}
          </button>
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
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
