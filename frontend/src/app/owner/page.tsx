"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { compressImageForUpload } from "@/lib/imageCompression";

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

const bedroomTypes = [
  ["", "Bedroom type"],
  ["STUDIO", "Studio"],
  ["ONE_BR", "1BR"],
  ["TWO_BR", "2BR"],
  ["THREE_BR_PLUS", "3BR+"],
];

function arrayToLines(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusBadge(status: string) {
  const base = "rounded px-3 py-1 text-xs font-semibold";

  if (status === "APPROVED") {
    return `${base} bg-emerald-100 text-emerald-700`;
  }

  if (status === "REJECTED") {
    return `${base} bg-rose-100 text-rose-700`;
  }

  if (status === "PENDING_REVIEW" || status === "PENDING") {
    return `${base} bg-amber-100 text-amber-700`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}

export default function OwnerPortalPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [accountStatus, setAccountStatus] =
    useState("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [destinations, setDestinations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [newName, setNewName] = useState("");
  const [newPropertyType, setNewPropertyType] =
    useState("APARTMENT");
  const [newRentalTerms, setNewRentalTerms] = useState([
    "DAILY",
    "MONTHLY",
  ]);
  const [newDestinationId, setNewDestinationId] =
    useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] =
    useState("Indonesia");
  const [newAddress, setNewAddress] = useState("");
  const [newDescription, setNewDescription] =
    useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [propertyType, setPropertyType] =
    useState("APARTMENT");
  const [supportedRentalTerms, setSupportedRentalTerms] =
    useState<string[]>(["DAILY"]);
  const [destinationId, setDestinationId] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] =
    useState("Asia/Jakarta");
  const [currency, setCurrency] = useState("IDR");
  const [description, setDescription] = useState("");
  const [propertyFacilities, setPropertyFacilities] =
    useState("");
  const [buildingFacilities, setBuildingFacilities] =
    useState("");
  const [additionalInfo, setAdditionalInfo] =
    useState("");

  const [roomTypeName, setRoomTypeName] = useState("");
  const [bedroomType, setBedroomType] = useState("");
  const [roomTypeCapacity, setRoomTypeCapacity] =
    useState("2");
  const [basePrice, setBasePrice] = useState("");
  const [roomTypeDescription, setRoomTypeDescription] =
    useState("");
  const [unitFacilities, setUnitFacilities] =
    useState("");

  const [roomName, setRoomName] = useState("");
  const [roomRoomTypeId, setRoomRoomTypeId] =
    useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("2");
  const [tower, setTower] = useState("");
  const [floor, setFloor] = useState("");
  const [electricityWatt, setElectricityWatt] =
    useState("");
  const [roomFacilities, setRoomFacilities] =
    useState("");
  const [roomAdditionalInfo, setRoomAdditionalInfo] =
    useState("");

  useEffect(() => {
    void loadInitialState();
  }, []);

  const selectedMedia = useMemo(() => {
    return Array.isArray(selected?.mediaAssets)
      ? selected.mediaAssets
      : [];
  }, [selected]);

  function tokenHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }

  function jsonHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...tokenHeaders(),
    };
  }

  async function loadInitialState() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const [profileResponse, destinationsResponse] =
        await Promise.all([
          fetch("/api/auth/profile", {
            headers: tokenHeaders(),
          }),
          fetch("/api/catalog/destinations"),
        ]);

      if (!profileResponse.ok) {
        throw new Error("Profile could not be loaded");
      }

      const profile = await profileResponse.json();

      if (profile?.role !== "OWNER") {
        router.push("/admin");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(profile),
      );
      setUser(profile);
      setAccountStatus(
        profile.accountStatus || "APPROVED",
      );
      setReviewNote(profile.accountReviewNote || "");

      if (destinationsResponse.ok) {
        setDestinations(
          await destinationsResponse.json(),
        );
      }

      if (profile.accountStatus === "APPROVED") {
        await loadProperties();
      }
    } catch (error) {
      console.error(error);
      setMessage("Owner portal could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  async function loadProperties(preferredId?: number) {
    const response = await fetch("/api/owner/properties", {
      headers: tokenHeaders(),
    });

    if (!response.ok) {
      throw new Error("Properties could not be loaded");
    }

    const data = await response.json();
    setProperties(data);

    const next =
      data.find(
        (property: any) =>
          property.id ===
          (preferredId || selected?.id),
      ) ||
      data[0] ||
      null;

    if (next) {
      selectProperty(next);
    } else {
      setSelected(null);
      resetPropertyForm();
    }
  }

  function selectProperty(property: any) {
    setSelected(property);
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
    setBuildingName(property.buildingName || "");
    setLatitude(
      property.latitude ? String(property.latitude) : "",
    );
    setLongitude(
      property.longitude
        ? String(property.longitude)
        : "",
    );
    setTimezone(property.timezone || "Asia/Jakarta");
    setCurrency(property.currency || "IDR");
    setDescription(property.description || "");
    setPropertyFacilities(
      arrayToLines(property.propertyFacilities),
    );
    setBuildingFacilities(
      arrayToLines(property.buildingFacilities),
    );
    setAdditionalInfo(property.additionalInfo || "");
    setRoomRoomTypeId(
      property.roomTypes?.[0]?.id
        ? String(property.roomTypes[0].id)
        : "",
    );
  }

  function resetPropertyForm() {
    setName("");
    setSlug("");
    setPropertyType("APARTMENT");
    setSupportedRentalTerms(["DAILY"]);
    setDestinationId("");
    setCity("");
    setCountry("Indonesia");
    setArea("");
    setAddress("");
    setFullAddress("");
    setBuildingName("");
    setLatitude("");
    setLongitude("");
    setTimezone("Asia/Jakarta");
    setCurrency("IDR");
    setDescription("");
    setPropertyFacilities("");
    setBuildingFacilities("");
    setAdditionalInfo("");
  }

  function toggleTerm(
    term: string,
    value: string[],
    setter: (next: string[]) => void,
  ) {
    if (value.includes(term)) {
      const next = value.filter((item) => item !== term);
      setter(next.length > 0 ? next : value);
      return;
    }

    setter([...value, term]);
  }

  function applyDestination(
    value: string,
    mode: "create" | "edit",
  ) {
    const destination = destinations.find(
      (item) => String(item.id) === value,
    );

    if (mode === "create") {
      setNewDestinationId(value);

      if (destination) {
        setNewCity(destination.city || "");
        setNewCountry(destination.country || "");
      }

      return;
    }

    setDestinationId(value);

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

  async function createProperty(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "/api/owner/properties",
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            name: newName,
            propertyType: newPropertyType,
            supportedRentalTerms: newRentalTerms,
            destinationId: newDestinationId || null,
            city: newCity,
            country: newCountry,
            address: newAddress,
            description: newDescription,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Property could not be created",
        );
      }

      setNewName("");
      setNewPropertyType("APARTMENT");
      setNewRentalTerms(["DAILY", "MONTHLY"]);
      setNewDestinationId("");
      setNewCity("");
      setNewCountry("Indonesia");
      setNewAddress("");
      setNewDescription("");

      await loadProperties(data.id);
      setMessage("Property draft created");
    } catch (error: any) {
      setMessage(error.message || "Property could not be created");
    } finally {
      setSaving(false);
    }
  }

  async function saveProperty(event: FormEvent) {
    event.preventDefault();

    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/owner/properties/${selected.id}`,
        {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify({
            name,
            slug,
            propertyType,
            supportedRentalTerms,
            destinationId: destinationId || null,
            city,
            country,
            area,
            address,
            fullAddress,
            buildingName,
            latitude,
            longitude,
            timezone,
            currency,
            description,
            propertyFacilities:
              linesToArray(propertyFacilities),
            buildingFacilities:
              linesToArray(buildingFacilities),
            additionalInfo,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Property could not be saved",
        );
      }

      await loadProperties(selected.id);
      setMessage("Property saved");
    } catch (error: any) {
      setMessage(error.message || "Property could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview() {
    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/owner/properties/${selected.id}/submit-review`,
        {
          method: "POST",
          headers: tokenHeaders(),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Submit review failed",
        );
      }

      await loadProperties(selected.id);
      setMessage("Property submitted for review");
    } catch (error: any) {
      setMessage(error.message || "Submit review failed");
    } finally {
      setSaving(false);
    }
  }

  async function createRoomType(event: FormEvent) {
    event.preventDefault();

    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/owner/properties/${selected.id}/room-types`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            name: roomTypeName,
            bedroomType: bedroomType || null,
            capacity: roomTypeCapacity,
            basePrice,
            description: roomTypeDescription,
            unitFacilities: linesToArray(unitFacilities),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Room type could not be saved",
        );
      }

      setRoomTypeName("");
      setBedroomType("");
      setRoomTypeCapacity("2");
      setBasePrice("");
      setRoomTypeDescription("");
      setUnitFacilities("");
      await loadProperties(selected.id);
      setMessage("Room type added");
    } catch (error: any) {
      setMessage(error.message || "Room type could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function createRoom(event: FormEvent) {
    event.preventDefault();

    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/owner/properties/${selected.id}/rooms`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            name: roomName,
            roomTypeId: roomRoomTypeId || null,
            price: roomPrice,
            capacity: roomCapacity,
            tower,
            floor,
            electricityWatt,
            unitFacilities: linesToArray(roomFacilities),
            additionalInfo: roomAdditionalInfo,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Room could not be saved",
        );
      }

      setRoomName("");
      setRoomPrice("");
      setRoomCapacity("2");
      setTower("");
      setFloor("");
      setElectricityWatt("");
      setRoomFacilities("");
      setRoomAdditionalInfo("");
      await loadProperties(selected.id);
      setMessage("Room added");
    } catch (error: any) {
      setMessage(error.message || "Room could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function uploadGalleryFile(file: File) {
    if (!selected) return;

    try {
      setUploading(true);
      setMessage("");

      const preparedFile = await compressImageForUpload(file, {
        maxBytes: 1400 * 1024,
        maxDimension: 1800,
        outputType: "image/webp",
      });
      const formData = new FormData();
      formData.append("file", preparedFile);

      const uploadResponse = await fetch(
        "/api/uploads/media",
        {
          method: "POST",
          headers: tokenHeaders(),
          body: formData,
        },
      );
      const uploadData = await uploadResponse
        .json()
        .catch(() => null);

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData?.message || "Upload failed",
        );
      }

      const mediaResponse = await fetch("/api/media", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          propertyId: selected.id,
          url: uploadData.url,
          mediaType: uploadData.mediaType || "IMAGE",
          category: "gallery",
          altText: selected.name,
        }),
      });
      const mediaData = await mediaResponse
        .json()
        .catch(() => null);

      if (!mediaResponse.ok) {
        throw new Error(
          mediaData?.message || "Media could not be saved",
        );
      }

      await loadProperties(selected.id);
      setMessage("Media uploaded");
    } catch (error: any) {
      setMessage(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadGalleryFile(file);
    }

    event.currentTarget.value = "";
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Owner Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.fullName || "Partner"}{" "}
            {accountStatus ? `- ${accountStatus}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/account"
            className="rounded bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            Profile
          </Link>
          <Link
            href="/"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Public Site
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow">
          Loading owner portal...
        </div>
      ) : accountStatus !== "APPROVED" ? (
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="text-sm font-semibold uppercase text-blue-700">
            Partnership Registration
          </div>
          <h2 className="mt-2 text-2xl font-bold">
            {accountStatus === "PENDING"
              ? "Waiting for admin approval"
              : "Registration not approved"}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            {accountStatus === "PENDING"
              ? "Your partner account is being reviewed."
              : reviewNote ||
                "Please contact MYTRIP admin for more information."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 text-lg font-bold">
                My Properties
              </h2>

              {properties.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No property draft yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
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
                      <div className="mt-1 text-xs opacity-80">
                        {property.city || "-"} /{" "}
                        {property.propertyType}
                      </div>
                      <div className="mt-2">
                        <span
                          className={
                            selected?.id === property.id
                              ? "rounded bg-white/20 px-2 py-1 text-xs font-semibold"
                              : statusBadge(
                                  property.approvalStatus ||
                                    "DRAFT",
                                )
                          }
                        >
                          {property.approvalStatus ||
                            "DRAFT"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={createProperty}
              className="rounded-lg bg-white p-4 shadow"
            >
              <h2 className="mb-3 text-lg font-bold">
                New Property
              </h2>
              <div className="grid gap-3">
                <input
                  value={newName}
                  onChange={(event) =>
                    setNewName(event.target.value)
                  }
                  placeholder="Property name"
                  className="rounded border p-3"
                  required
                />
                <select
                  value={newPropertyType}
                  onChange={(event) =>
                    setNewPropertyType(
                      event.target.value,
                    )
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
                  value={newDestinationId}
                  onChange={(event) =>
                    applyDestination(
                      event.target.value,
                      "create",
                    )
                  }
                  className="rounded border p-3"
                >
                  <option value="">
                    Select destination
                  </option>
                  {destinations.map((destination) => (
                    <option
                      key={destination.id}
                      value={destination.id}
                    >
                      {destination.displayName}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {rentalTerms.map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={newRentalTerms.includes(
                          value,
                        )}
                        onChange={() =>
                          toggleTerm(
                            value,
                            newRentalTerms,
                            setNewRentalTerms,
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <input
                  value={newCity}
                  onChange={(event) =>
                    setNewCity(event.target.value)
                  }
                  placeholder="City"
                  className="rounded border p-3"
                />
                <input
                  value={newCountry}
                  onChange={(event) =>
                    setNewCountry(event.target.value)
                  }
                  placeholder="Country"
                  className="rounded border p-3"
                />
                <input
                  value={newAddress}
                  onChange={(event) =>
                    setNewAddress(event.target.value)
                  }
                  placeholder="Address"
                  className="rounded border p-3"
                />
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(event) =>
                    setNewDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Description"
                  className="rounded border p-3"
                />
                <button
                  disabled={saving}
                  className="rounded bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  {saving ? "Saving..." : "Create Draft"}
                </button>
              </div>
            </form>
          </aside>

          {selected ? (
            <section className="space-y-6">
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
                  label="Media"
                  value={selectedMedia.length}
                />
                <Metric
                  label="Published"
                  value={selected.isPublished ? "Yes" : "No"}
                />
              </div>

              <div className="rounded-lg bg-white p-5 shadow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selected.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={statusBadge(
                          selected.approvalStatus ||
                            "DRAFT",
                        )}
                      >
                        {selected.approvalStatus ||
                          "DRAFT"}
                      </span>
                      <span
                        className={
                          selected.isPublished
                            ? "rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        }
                      >
                        {selected.isPublished
                          ? "Published"
                          : "Not Published"}
                      </span>
                    </div>
                    {selected.approvalNote && (
                      <p className="mt-3 text-sm text-slate-600">
                        Note: {selected.approvalNote}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={submitForReview}
                    disabled={
                      saving ||
                      selected.approvalStatus ===
                        "PENDING_REVIEW"
                    }
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                  >
                    {selected.approvalStatus ===
                    "PENDING_REVIEW"
                      ? "In Review"
                      : "Submit Review"}
                  </button>
                </div>
              </div>

              <form
                onSubmit={saveProperty}
                className="rounded-lg bg-white p-5 shadow"
              >
                <h2 className="mb-4 text-xl font-bold">
                  Property Information
                </h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Property name"
                    className="rounded border p-3"
                    required
                  />
                  <input
                    value={slug}
                    onChange={(event) =>
                      setSlug(event.target.value)
                    }
                    placeholder="Slug"
                    className="rounded border p-3"
                  />
                  <select
                    value={propertyType}
                    onChange={(event) =>
                      setPropertyType(
                        event.target.value,
                      )
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
                    onChange={(event) =>
                      applyDestination(
                        event.target.value,
                        "edit",
                      )
                    }
                    className="rounded border p-3"
                  >
                    <option value="">
                      Select destination
                    </option>
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
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    placeholder="City"
                    className="rounded border p-3"
                  />
                  <input
                    value={country}
                    onChange={(event) =>
                      setCountry(event.target.value)
                    }
                    placeholder="Country"
                    className="rounded border p-3"
                  />
                  <input
                    value={area}
                    onChange={(event) =>
                      setArea(event.target.value)
                    }
                    placeholder="Area"
                    className="rounded border p-3"
                  />
                  <input
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    placeholder="Short address"
                    className="rounded border p-3"
                  />
                  <input
                    value={buildingName}
                    onChange={(event) =>
                      setBuildingName(
                        event.target.value,
                      )
                    }
                    placeholder="Building name"
                    className="rounded border p-3"
                  />
                  <input
                    value={latitude}
                    onChange={(event) =>
                      setLatitude(event.target.value)
                    }
                    placeholder="Latitude"
                    className="rounded border p-3"
                  />
                  <input
                    value={longitude}
                    onChange={(event) =>
                      setLongitude(event.target.value)
                    }
                    placeholder="Longitude"
                    className="rounded border p-3"
                  />
                  <input
                    value={timezone}
                    onChange={(event) =>
                      setTimezone(event.target.value)
                    }
                    placeholder="Timezone"
                    className="rounded border p-3"
                  />
                  <input
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value)
                    }
                    placeholder="Currency"
                    className="rounded border p-3"
                  />
                  <div className="rounded border p-3 lg:col-span-2">
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
                              toggleTerm(
                                value,
                                supportedRentalTerms,
                                setSupportedRentalTerms,
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={fullAddress}
                    onChange={(event) =>
                      setFullAddress(
                        event.target.value,
                      )
                    }
                    placeholder="Full address"
                    className="rounded border p-3 lg:col-span-3"
                  />
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Description"
                    className="rounded border p-3 lg:col-span-3"
                  />
                  <textarea
                    rows={4}
                    value={propertyFacilities}
                    onChange={(event) =>
                      setPropertyFacilities(
                        event.target.value,
                      )
                    }
                    placeholder="Property facilities, one per line"
                    className="rounded border p-3"
                  />
                  <textarea
                    rows={4}
                    value={buildingFacilities}
                    onChange={(event) =>
                      setBuildingFacilities(
                        event.target.value,
                      )
                    }
                    placeholder="Building facilities, one per line"
                    className="rounded border p-3"
                  />
                  <textarea
                    rows={4}
                    value={additionalInfo}
                    onChange={(event) =>
                      setAdditionalInfo(
                        event.target.value,
                      )
                    }
                    placeholder="Additional information"
                    className="rounded border p-3"
                  />
                  <button
                    disabled={saving}
                    className="rounded bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    {saving ? "Saving..." : "Save Property"}
                  </button>
                </div>
              </form>

              <div className="rounded-lg bg-white p-5 shadow">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    Gallery
                  </h2>
                  <label className="cursor-pointer rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    {uploading ? "Uploading..." : "Upload Media"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                      onChange={onGalleryChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedMedia.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No media yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {selectedMedia.map((media: any) => (
                      <div
                        key={media.id}
                        className="overflow-hidden rounded border bg-slate-50"
                      >
                        {media.mediaType === "VIDEO" ? (
                          <video
                            src={media.url}
                            className="h-36 w-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={media.altText || name}
                            className="h-36 w-full object-cover"
                          />
                        )}
                        <div className="truncate p-2 text-xs text-slate-500">
                          {media.category || "gallery"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={createRoomType}
                  className="rounded-lg bg-white p-5 shadow"
                >
                  <h2 className="mb-4 text-xl font-bold">
                    Room Type
                  </h2>
                  <div className="grid gap-3">
                    <input
                      value={roomTypeName}
                      onChange={(event) =>
                        setRoomTypeName(
                          event.target.value,
                        )
                      }
                      placeholder="Room type name"
                      className="rounded border p-3"
                      required
                    />
                    <select
                      value={bedroomType}
                      onChange={(event) =>
                        setBedroomType(
                          event.target.value,
                        )
                      }
                      className="rounded border p-3"
                    >
                      {bedroomTypes.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min="1"
                        value={roomTypeCapacity}
                        onChange={(event) =>
                          setRoomTypeCapacity(
                            event.target.value,
                          )
                        }
                        placeholder="Capacity"
                        className="rounded border p-3"
                      />
                      <input
                        type="number"
                        min="0"
                        value={basePrice}
                        onChange={(event) =>
                          setBasePrice(
                            event.target.value,
                          )
                        }
                        placeholder="Base price"
                        className="rounded border p-3"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={roomTypeDescription}
                      onChange={(event) =>
                        setRoomTypeDescription(
                          event.target.value,
                        )
                      }
                      placeholder="Description"
                      className="rounded border p-3"
                    />
                    <textarea
                      rows={4}
                      value={unitFacilities}
                      onChange={(event) =>
                        setUnitFacilities(
                          event.target.value,
                        )
                      }
                      placeholder="Unit facilities, one per line"
                      className="rounded border p-3"
                    />
                    <button
                      disabled={saving}
                      className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Add Room Type
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={createRoom}
                  className="rounded-lg bg-white p-5 shadow"
                >
                  <h2 className="mb-4 text-xl font-bold">
                    Room / Unit
                  </h2>
                  <div className="grid gap-3">
                    <input
                      value={roomName}
                      onChange={(event) =>
                        setRoomName(event.target.value)
                      }
                      placeholder="Room or unit name"
                      className="rounded border p-3"
                      required
                    />
                    <select
                      value={roomRoomTypeId}
                      onChange={(event) =>
                        setRoomRoomTypeId(
                          event.target.value,
                        )
                      }
                      className="rounded border p-3"
                    >
                      <option value="">
                        Without room type
                      </option>
                      {(selected.roomTypes || []).map(
                        (roomType: any) => (
                          <option
                            key={roomType.id}
                            value={roomType.id}
                          >
                            {roomType.name}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min="0"
                        value={roomPrice}
                        onChange={(event) =>
                          setRoomPrice(
                            event.target.value,
                          )
                        }
                        placeholder="Price"
                        className="rounded border p-3"
                      />
                      <input
                        type="number"
                        min="1"
                        value={roomCapacity}
                        onChange={(event) =>
                          setRoomCapacity(
                            event.target.value,
                          )
                        }
                        placeholder="Capacity"
                        className="rounded border p-3"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        value={tower}
                        onChange={(event) =>
                          setTower(event.target.value)
                        }
                        placeholder="Tower"
                        className="rounded border p-3"
                      />
                      <input
                        value={floor}
                        onChange={(event) =>
                          setFloor(event.target.value)
                        }
                        placeholder="Floor"
                        className="rounded border p-3"
                      />
                      <input
                        type="number"
                        min="0"
                        value={electricityWatt}
                        onChange={(event) =>
                          setElectricityWatt(
                            event.target.value,
                          )
                        }
                        placeholder="Watt"
                        className="rounded border p-3"
                      />
                    </div>
                    <textarea
                      rows={4}
                      value={roomFacilities}
                      onChange={(event) =>
                        setRoomFacilities(
                          event.target.value,
                        )
                      }
                      placeholder="Unit facilities, one per line"
                      className="rounded border p-3"
                    />
                    <textarea
                      rows={3}
                      value={roomAdditionalInfo}
                      onChange={(event) =>
                        setRoomAdditionalInfo(
                          event.target.value,
                        )
                      }
                      placeholder="Additional information"
                      className="rounded border p-3"
                    />
                    <button
                      disabled={saving}
                      className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Add Room
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ) : (
            <section className="rounded-lg bg-white p-8 text-slate-500 shadow">
              Create a property draft to start.
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
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
