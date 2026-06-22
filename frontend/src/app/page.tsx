"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const propertyTypes = [
  ["", "All Property"],
  ["APARTMENT", "Apartment"],
  ["VILLA", "Villa"],
  ["HOTEL", "Hotel"],
  ["RESORT", "Resort"],
  ["CO_LIVING", "Co-Living"],
];

const bedroomTypes = [
  ["", "Any Room"],
  ["STUDIO", "Studio"],
  ["ONE_BR", "1BR"],
  ["TWO_BR", "2BR"],
  ["THREE_BR_PLUS", "3BR+"],
];

const rentalTerms = [
  ["DAILY", "Daily"],
  ["MONTHLY", "Monthly"],
  ["YEARLY", "Yearly"],
];

const sortOptions = [
  ["rating", "Best Rating"],
  ["price_asc", "Lowest Price"],
  ["price_desc", "Highest Price"],
  ["newest", "Newest"],
];

function formatCurrency(value: number | null) {
  if (!value) {
    return "Ask price";
  }

  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function coverImage(property: any) {
  return property.coverImage || "/images/logo.png";
}

export default function HomePage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [destination, setDestination] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedroomType, setBedroomType] = useState("");
  const [rentalTerm, setRentalTerm] = useState("MONTHLY");
  const [sort, setSort] = useState("rating");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] =
    useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }

    loadDestinations();
    searchProperties();
  }, []);

  async function loadDestinations() {
    const response = await fetch(
      "/api/catalog/destinations",
    );

    if (response.ok) {
      const data = await response.json();
      setDestinations(data);

      const bali = data.find(
        (item: any) => item.slug === "indonesia-bali",
      );

      if (bali) {
        setDestination(bali.slug);
      }
    }
  }

  async function searchProperties(
    e?: React.FormEvent,
  ) {
    e?.preventDefault();

    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (destination) {
        params.set("destination", destination);
      }

      if (propertyType) {
        params.set("propertyType", propertyType);
      }

      if (bedroomType) {
        params.set("bedroomType", bedroomType);
      }

      if (rentalTerm) {
        params.set("rentalTerm", rentalTerm);
      }

      params.set("sort", sort);

      const response = await fetch(
        `/api/catalog/properties?${params.toString()}`,
      );

      if (response.ok) {
        setProperties(await response.json());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="MYTRIP Asia"
              className="h-11 w-11 rounded"
            />
            <div>
              <div className="text-xl font-bold">
                MYTRIP Asia
              </div>
              <div className="text-xs text-slate-500">
                Stay, lease, and manage properties
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap justify-end gap-2">
            {currentUser?.role === "CUSTOMER" && (
              <Link
                href="/account"
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                My Account
              </Link>
            )}

            {currentUser?.role === "OWNER" && (
              <Link
                href="/owner"
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                Owner Portal
              </Link>
            )}

            {[
              "ADMIN",
              "SUPERADMIN",
              "FINANCE_HEAD",
            ].includes(currentUser?.role) && (
              <Link
                href="/admin"
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                Dashboard
              </Link>
            )}

            <Link
              href="/register"
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              Buat Akun
            </Link>

            <Link
              href="/partner/register"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Daftarkan Property Saya
            </Link>

            <Link
              href="/login"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase text-blue-700">
              MYTRIP Property Search
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal md:text-6xl">
              Find stays for daily trips and longer
              living across Asia.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Search apartments, villas, hotels,
              resorts, and co-living units by
              destination, room type, and rental
              period.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg bg-slate-900">
            <img
              src="/images/logo.png"
              alt="MYTRIP Asia property catalog"
              className="mx-auto h-72 w-72 object-contain p-10"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-6">
        <form
          onSubmit={searchProperties}
          className="grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-2 xl:grid-cols-6"
        >
          <select
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value)
            }
            className="rounded border border-slate-200 p-3"
          >
            <option value="">All Destinations</option>
            {destinations.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.displayName}
              </option>
            ))}
          </select>

          <select
            value={propertyType}
            onChange={(e) =>
              setPropertyType(e.target.value)
            }
            className="rounded border border-slate-200 p-3"
          >
            {propertyTypes.map(([value, label]) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={bedroomType}
            onChange={(e) =>
              setBedroomType(e.target.value)
            }
            className="rounded border border-slate-200 p-3"
          >
            {bedroomTypes.map(([value, label]) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={rentalTerm}
            onChange={(e) =>
              setRentalTerm(e.target.value)
            }
            className="rounded border border-slate-200 p-3"
          >
            {rentalTerms.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-slate-200 p-3"
          >
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Available Properties
          </h2>
          <div className="text-sm text-slate-500">
            {properties.length} result
            {properties.length === 1 ? "" : "s"}
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-slate-500 shadow">
            No property found for this search.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.slug || property.id}`}
                className="overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  <img
                    src={coverImage(property)}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {property.propertyType}
                    </span>
                    <span className="text-sm font-semibold text-amber-600">
                      {property.rating.toFixed(1)} / 5
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold">
                    {property.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {property.area
                      ? `${property.area}, `
                      : ""}
                    {property.city || property.country}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.supportedRentalTerms.map(
                      (term: string) => (
                        <span
                          key={term}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {term}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="mt-4 text-lg font-bold">
                    {formatCurrency(property.minPrice)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Starting price
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
