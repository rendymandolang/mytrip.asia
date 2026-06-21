"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data =
        await response.json();

      console.log(
        "STATUS:",
        response.status,
      );

      console.log(
        "RESPONSE:",
        data,
      );

      if (
        response.ok &&
        data.access_token
      ) {
        localStorage.setItem(
          "token",
          data.access_token,
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user),
        );

        alert("Login Success");

        router.push(
          data.user?.role === "OWNER"
            ? "/owner"
            : "/admin",
        );
      } else {
        alert(
          data.message ||
            "Login Failed",
        );
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error,
      );

      alert("Login Error");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">
          MYTRIP
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Admin Dashboard Login
        </p>

        <form
          onSubmit={handleLogin}
        >
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              className="w-full rounded border p-3"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value,
                )
              }
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              className="w-full rounded border p-3"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value,
                )
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
