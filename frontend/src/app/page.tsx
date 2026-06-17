import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          MYTRIP Asia
        </h1>

        <p className="mt-4 text-slate-600">
          Hotel, Villa & Resort Management Platform
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
