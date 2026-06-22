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

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return toDateInput(date);
}

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState(addDays(1));
  const [checkOut, setCheckOut] = useState(addDays(2));
  const [rentalTerm, setRentalTerm] = useState("DAILY");
  const [availability, setAvailability] =
    useState<any>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] =
    useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCountry, setGuestCountry] =
    useState("Indonesia");
  const [guestNotes, setGuestNotes] = useState("");
  const [bookingLoading, setBookingLoading] =
    useState(false);
  const [bookingMessage, setBookingMessage] =
    useState("");

  useEffect(() => {
    loadProperty();
  }, [params.identifier]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "CUSTOMER") {
        return;
      }

      setGuestName(user.fullName || "");
      setGuestEmail(user.email || "");
      setGuestPhone(user.phone || "");
    } catch {
      return;
    }
  }, []);

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

  async function checkAvailability(e?: React.FormEvent) {
    e?.preventDefault();

    try {
      setBookingLoading(true);
      setBookingMessage("");

      const params = new URLSearchParams({
        slug: String(paramsIdentifier()),
        checkIn,
        checkOut,
        rentalTerm,
      });

      const response = await fetch(
        `/api/booking-engine/availability?${params.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
                "Availability check failed",
        );
      }

      setAvailability(data);
      setSelectedRoomTypeId(
        data.options?.[0]?.roomType?.id
          ? String(data.options[0].roomType.id)
          : "",
      );
    } catch (availabilityError) {
      setAvailability(null);
      setBookingMessage(
        availabilityError instanceof Error
          ? availabilityError.message
          : "Availability check failed",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  async function createBooking(e: React.FormEvent) {
    e.preventDefault();

    try {
      setBookingLoading(true);
      setBookingMessage("");

      const response = await fetch(
        "/api/booking-engine/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
              ? {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
              : {}),
          },
          body: JSON.stringify({
            slug: String(paramsIdentifier()),
            roomTypeId: Number(selectedRoomTypeId),
            checkIn,
            checkOut,
            rentalTerm,
            guest: {
              fullName: guestName,
              email: guestEmail,
              phone: guestPhone,
              country: guestCountry,
              notes: guestNotes,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Booking failed",
        );
      }

      setBookingMessage(
        `Booking #${data.booking.id} submitted. Status: ${data.booking.status}`,
      );
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setGuestNotes("");
      await checkAvailability();
    } catch (bookingError) {
      setBookingMessage(
        bookingError instanceof Error
          ? bookingError.message
          : "Booking failed",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  function paramsIdentifier() {
    return Array.isArray(params.identifier)
      ? params.identifier[0]
      : params.identifier;
  }

  const selectedOption = availability?.options?.find(
    (option: any) =>
      String(option.roomType.id) === selectedRoomTypeId,
  );

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

          <form
            onSubmit={checkAvailability}
            className="mt-5 space-y-3"
          >
            <input
              type="date"
              value={checkIn}
              onChange={(e) =>
                setCheckIn(e.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              required
            />

            <input
              type="date"
              value={checkOut}
              onChange={(e) =>
                setCheckOut(e.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
              required
            />

            <select
              value={rentalTerm}
              onChange={(e) =>
                setRentalTerm(e.target.value)
              }
              className="w-full rounded border border-slate-200 p-3"
            >
              {(property.supportedRentalTerms || [
                "DAILY",
              ]).map((term: string) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full rounded bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              {bookingLoading
                ? "Checking..."
                : "Check Availability"}
            </button>
          </form>

          {availability && (
            <form
              onSubmit={createBooking}
              className="mt-5 space-y-3 border-t border-slate-200 pt-5"
            >
              <select
                value={selectedRoomTypeId}
                onChange={(e) =>
                  setSelectedRoomTypeId(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
                required
              >
                {availability.options.map((option: any) => (
                  <option
                    key={option.roomType.id}
                    value={option.roomType.id}
                  >
                    {option.roomType.name} -{" "}
                    {option.availableRooms} available
                  </option>
                ))}
              </select>

              {selectedOption && (
                <div className="rounded bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Nights</span>
                    <span>
                      {selectedOption.quote.nights}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(
                        selectedOption.quote.subtotal,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees + Deposit</span>
                    <span>
                      {formatCurrency(
                        selectedOption.quote.serviceFee +
                          selectedOption.quote
                            .cleaningFee +
                          selectedOption.quote.deposit,
                      )}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        selectedOption.quote.totalAmount,
                      )}
                    </span>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Full name"
                value={guestName}
                onChange={(e) =>
                  setGuestName(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={guestEmail}
                onChange={(e) =>
                  setGuestEmail(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
                required
              />

              <input
                type="text"
                placeholder="Phone"
                value={guestPhone}
                onChange={(e) =>
                  setGuestPhone(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
              />

              <input
                type="text"
                placeholder="Country"
                value={guestCountry}
                onChange={(e) =>
                  setGuestCountry(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
              />

              <textarea
                rows={3}
                placeholder="Notes"
                value={guestNotes}
                onChange={(e) =>
                  setGuestNotes(e.target.value)
                }
                className="w-full rounded border border-slate-200 p-3"
              />

              <button
                type="submit"
                disabled={
                  bookingLoading || !selectedRoomTypeId
                }
                className="w-full rounded bg-green-600 px-5 py-3 font-semibold text-white"
              >
                {bookingLoading
                  ? "Submitting..."
                  : "Submit Booking"}
              </button>
            </form>
          )}

          {bookingMessage && (
            <div className="mt-4 rounded bg-slate-100 p-3 text-sm text-slate-700">
              {bookingMessage}
            </div>
          )}

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
