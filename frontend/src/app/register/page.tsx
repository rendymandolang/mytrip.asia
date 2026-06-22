"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
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
            role: "CUSTOMER",
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

      router.push("/");
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
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow md:p-8">
        <Link
          href="/"
          className="mb-6 flex items-center gap-3"
        >
          <img
            src="/images/logo.png"
            alt="MYTRIP Asia"
            className="h-10 w-10 rounded"
          />
          <div>
            <div className="text-xl font-bold">
              MYTRIP Asia
            </div>
            <div className="text-xs text-slate-500">
              Guest Account
            </div>
          </div>
        </Link>

        <h1 className="text-2xl font-bold">
          Buat Akun
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create your guest account for bookings and
          saved property searches.
        </p>

        <form
          onSubmit={register}
          className="mt-6 space-y-4"
        >
          <input
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            className="w-full rounded border border-slate-200 p-3"
            placeholder="Full name"
            required
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="w-full rounded border border-slate-200 p-3"
            placeholder="Email"
            required
          />

          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            className="w-full rounded border border-slate-200 p-3"
            placeholder="Phone"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="w-full rounded border border-slate-200 p-3"
            placeholder="Password"
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 p-3 font-semibold text-white disabled:bg-slate-400"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
          <Link
            href="/login"
            className="font-semibold text-blue-700"
          >
            Login
          </Link>
          <Link
            href="/partner/register"
            className="font-semibold text-blue-700"
          >
            Daftarkan Property Saya
          </Link>
        </div>
      </div>
    </main>
  );
}
