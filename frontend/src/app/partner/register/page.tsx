"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const registerResponse = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
            role: "OWNER",
          }),
        },
      );

      const registerData =
        await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.message || "Register failed",
        );
      }

      const loginResponse = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.access_token) {
        localStorage.setItem(
          "token",
          loginData.access_token,
        );
        localStorage.setItem(
          "user",
          JSON.stringify(loginData.user),
        );
      }

      router.push("/owner");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Register failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg bg-slate-900 p-6 text-white shadow md:p-8">
          <Link
            href="/"
            className="mb-8 flex items-center gap-3"
          >
            <img
              src="/images/logo.png"
              alt="MYTRIP Asia"
              className="h-11 w-11 rounded bg-white"
            />
            <div>
              <div className="text-xl font-bold">
                MYTRIP Asia
              </div>
              <div className="text-xs text-slate-300">
                Partner Portal
              </div>
            </div>
          </Link>

          <h1 className="text-3xl font-bold">
            Daftarkan Property Saya
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Create a partner account to manage properties,
            rooms, pricing, media, bookings, and PMS
            operations inside MYTRIP.
          </p>

          <div className="mt-8 grid gap-3 text-sm">
            <div className="rounded border border-white/10 bg-white/5 p-4">
              Manage villas, apartments, hotels, resorts
              and co-living units.
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4">
              Add rooms, gallery media, pricing rules,
              and availability.
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4">
              Track booking approval, finance,
              operations, and channel sync.
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow md:p-8">
          <h2 className="text-2xl font-bold">
            Partner Registration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your account will open the partner dashboard.
          </p>

          <form
            onSubmit={register}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <input
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              className="rounded border border-slate-200 p-3 md:col-span-2"
              placeholder="Full name"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="rounded border border-slate-200 p-3"
              placeholder="Email"
              required
            />

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="rounded border border-slate-200 p-3"
              placeholder="Phone"
            />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="rounded border border-slate-200 p-3 md:col-span-2"
              placeholder="Password"
              minLength={6}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 p-3 font-semibold text-white disabled:bg-slate-400 md:col-span-2"
            >
              {loading
                ? "Creating..."
                : "Create Partner Account"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            <Link
              href="/login"
              className="font-semibold text-blue-700"
            >
              Partner Login
            </Link>
            <Link
              href="/register"
              className="font-semibold text-blue-700"
            >
              Buat Akun Tamu
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
