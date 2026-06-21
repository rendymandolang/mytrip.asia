"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [xProfile, setXProfile] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      alert("Failed to load profile");
      return;
    }

    const profile = await response.json();
    const socialLinks = profile.socialLinks || {};

    setFullName(profile.fullName || "");
    setEmail(profile.email || "");
    setRole(profile.role || "");
    setDepartment(profile.department || "");
    setJobTitle(profile.jobTitle || "");
    setPhone(profile.phone || "");
    setAvatarUrl(profile.avatarUrl || "");
    setBio(profile.bio || "");
    setWebsite(socialLinks.website || "");
    setLinkedin(socialLinks.linkedin || "");
    setInstagram(socialLinks.instagram || "");
    setFacebook(socialLinks.facebook || "");
    setXProfile(socialLinks.x || "");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName,
            department,
            jobTitle,
            phone,
            avatarUrl,
            bio,
            socialLinks: {
              website,
              linkedin,
              instagram,
              facebook,
              x: xProfile,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error();
      }

      const updatedProfile = await response.json();

      localStorage.setItem(
        "user",
        JSON.stringify(updatedProfile),
      );

      alert("Profile updated successfully");
    } catch {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Profile Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage general information and social links.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Dashboard
        </Link>
      </div>

      <form
        onSubmit={saveProfile}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Profile Photo
          </h2>

          <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-3xl font-bold text-slate-500">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              fullName.slice(0, 1).toUpperCase() ||
              "U"
            )}
          </div>

          <label className="mb-2 block text-sm font-medium">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) =>
              setAvatarUrl(e.target.value)
            }
            className="w-full rounded border p-3"
            placeholder="https://..."
          />

          <p className="mt-3 text-sm text-slate-500">
            File upload can be added later when storage is
            ready.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">
            General Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                className="w-full rounded border p-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                className="w-full rounded border bg-slate-100 p-3"
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Role
              </label>
              <input
                type="text"
                value={role}
                className="w-full rounded border bg-slate-100 p-3"
                disabled
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                className="w-full rounded border p-3"
                placeholder="Finance, Operations, Sales"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) =>
                  setJobTitle(e.target.value)
                }
                className="w-full rounded border p-3"
                placeholder="Finance Head"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="w-full rounded border p-3"
                placeholder="+62..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded border p-3"
                rows={4}
                placeholder="Short profile description"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow lg:col-span-3">
          <h2 className="mb-4 text-xl font-semibold">
            Social Media Links
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="url"
              value={website}
              onChange={(e) =>
                setWebsite(e.target.value)
              }
              className="rounded border p-3"
              placeholder="Website"
            />

            <input
              type="url"
              value={linkedin}
              onChange={(e) =>
                setLinkedin(e.target.value)
              }
              className="rounded border p-3"
              placeholder="LinkedIn"
            />

            <input
              type="url"
              value={instagram}
              onChange={(e) =>
                setInstagram(e.target.value)
              }
              className="rounded border p-3"
              placeholder="Instagram"
            />

            <input
              type="url"
              value={facebook}
              onChange={(e) =>
                setFacebook(e.target.value)
              }
              className="rounded border p-3"
              placeholder="Facebook"
            />

            <input
              type="url"
              value={xProfile}
              onChange={(e) =>
                setXProfile(e.target.value)
              }
              className="rounded border p-3"
              placeholder="X / Twitter"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-6 py-3 text-white disabled:bg-slate-400"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </main>
  );
}
