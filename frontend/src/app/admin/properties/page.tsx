"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] =
    useState<any[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
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
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Properties
        </h1>

        <Link
          href="/admin"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Dashboard
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
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
