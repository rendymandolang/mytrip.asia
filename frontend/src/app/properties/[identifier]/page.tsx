"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function formatCurrency(value: string | number | null) {
  if (!value) {
    return "Ask price";
  }

  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function imageList(property: any) {
  const gallery = Array.isArray(property?.gallery)
    ? property.gallery
    : [];

  if (gallery.length > 0) {
    return gallery;
  }

  const roomImages =
    property?.rooms?.flatMap((room: any) =>
      Array.isArray(room.gallery) ? room.gallery : [],
    ) || [];

  return roomImages.length > 0
    ? roomImages
    : ["/images/logo.png"];
}

function mapsUrl(property: any) {
  if (property.latitude && property.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    property.fullAddress ||
      property.address ||
      property.name,
  )}`;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProperty();
  }, [params.identifier]);

  async function loadProperty() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/catalog/properties/${params.identifier}`,
      );

      if (!response.ok) {
        throw new Error("Property not found");
      }

      setProperty(await response.json());
    } catch (loadError) {
      console.error(loadError);
      setError("Property could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        Loading property...
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="rounded bg-white p-8 shadow">
          {error || "Property not found"}
        </div>
      </main>
    );
  }

  const images = imageList(property);
  const featuredRooms = property.rooms || [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="MYTRIP Asia"
              className="h-10 w-10 rounded"
            />
            <span className="text-xl font-bold">
              MYTRIP Asia
            </span>
          </Link>

          <Link
            href="/"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow md:col-span-2 md:row-span-2">
            <img
              src={images[0]}
              alt={property.name}
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          {images.slice(1, 5).map((image: string) => (
            <div
              key={image}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <img
                src={image}
                alt={property.name}
                className="h-40 w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-14 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {property.propertyType}
              </span>
              {property.supportedRentalTerms.map(
                (term: string) => (
                  <span
                    key={term}
                    className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {term}
                  </span>
                ),
              )}
            </div>

            <h1 className="text-3xl font-bold md:text-4xl">
              {property.name}
            </h1>
            <p className="mt-2 text-slate-600">
              {property.area ? `${property.area}, ` : ""}
              {property.city}, {property.country}
            </p>

            <div className="mt-4 text-sm text-slate-600">
              Rating {property.rating.toFixed(1)} / 5 from{" "}
              {property.reviewCount} review
              {property.reviewCount === 1 ? "" : "s"}
            </div>

            {property.description && (
              <p className="mt-5 leading-7 text-slate-700">
                {property.description}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Property Information
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="Type" value={property.propertyType} />
              <Info
                label="Building"
                value={property.buildingName || "-"}
              />
              <Info
                label="Destination"
                value={
                  property.destination?.displayName ||
                  property.city
                }
              />
              <Info
                label="Currency"
                value={property.currency}
              />
              <Info
                label="Address"
                value={
                  property.fullAddress ||
                  property.address ||
                  "-"
                }
              />
              <Info
                label="Map"
                value={
                  <a
                    href={mapsUrl(property)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600"
                  >
                    Open map point
                  </a>
                }
              />
            </div>
          </div>

          <FacilitySection
            title="Property Facilities"
            items={property.propertyFacilities}
          />

          <FacilitySection
            title="Building Facilities"
            items={property.buildingFacilities}
          />

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">
              Room Options
            </h2>

            <div className="mt-4 space-y-4">
              {featuredRooms.length === 0 ? (
                <p className="text-slate-500">
                  Room details are not available yet.
                </p>
              ) : (
                featuredRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="rounded border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">
                          {room.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {room.roomType?.name || "Room"}{" "}
                          {room.floor
                            ? `- Floor ${room.floor}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(room.price)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Starting price
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                      <div>Capacity: {room.capacity}</div>
                      <div>
                        Tower: {room.tower || "-"}
                      </div>
                      <div>
                        Electricity:{" "}
                        {room.electricityWatt
                          ? `${room.electricityWatt} W`
                          : "-"}
                      </div>
                    </div>

                    {room.unitFacilities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.unitFacilities.map(
                          (item: string) => (
                            <span
                              key={item}
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                            >
                              {item}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {property.additionalInfo && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-bold">
                Additional Information
              </h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
                {property.additionalInfo}
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg bg-white p-6 shadow lg:sticky lg:top-6">
          <div className="text-sm text-slate-500">
            Starting from
          </div>
          <div className="mt-1 text-3xl font-bold">
            {formatCurrency(property.minPrice)}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {property.supportedRentalTerms.join(", ")}
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded bg-blue-600 px-5 py-3 font-semibold text-white"
            onClick={() =>
              alert(
                "Booking engine will be connected in the next milestone.",
              )
            }
          >
            Check Availability
          </button>

          <a
            href={mapsUrl(property)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block w-full rounded border border-slate-200 px-5 py-3 text-center font-semibold text-slate-700"
          >
            View Map
          </a>
        </aside>
      </section>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}

function FacilitySection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {items?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-slate-500">
          No information available yet.
        </p>
      )}
    </div>
  );
}
