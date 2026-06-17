import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-white">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="MYTRIP Asia"
              width={45}
              height={45}
            />

            <span className="text-xl font-bold">
              MYTRIP Asia
            </span>
          </div>

          <a
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Admin Login
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900 via-blue-700 to-cyan-600" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center text-white">
          <h1 className="text-5xl font-extrabold md:text-7xl">
            Explore Asia
            <br />
            With MYTRIP
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/90">
            Hotels, Villas, Resorts, Transportation,
            Tours and Hospitality Solutions in one
            integrated platform.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg">
              Search Properties
            </button>

            <button className="rounded-xl border border-white px-8 py-4">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">
            Featured Destinations
          </h2>

          <p className="mt-4 text-gray-600">
            Discover the most popular destinations
            across Indonesia and Asia.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-100 p-10 text-center shadow">
            Bali
          </div>

          <div className="rounded-2xl bg-slate-100 p-10 text-center shadow">
            Bunaken
          </div>

          <div className="rounded-2xl bg-slate-100 p-10 text-center shadow">
            Raja Ampat
          </div>

          <div className="rounded-2xl bg-slate-100 p-10 text-center shadow">
            Labuan Bajo
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold">
              Our Ecosystem
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white p-8 shadow">
              <h3 className="text-xl font-bold">
                Hotels
              </h3>

              <p className="mt-3 text-gray-600">
                Business hotels and city stays.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h3 className="text-xl font-bold">
                Villas & Resorts
              </h3>

              <p className="mt-3 text-gray-600">
                Luxury accommodations and
                holiday destinations.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h3 className="text-xl font-bold">
                Transportation
              </h3>

              <p className="mt-3 text-gray-600">
                Airport transfer, car rental
                and logistics.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow">
              <h3 className="text-xl font-bold">
                Tours
              </h3>

              <p className="mt-3 text-gray-600">
                Activities, experiences and
                adventures.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">
            Built For Hospitality
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border p-6">
            Property Management
          </div>

          <div className="rounded-xl border p-6">
            Booking Engine
          </div>

          <div className="rounded-xl border p-6">
            Guest CRM
          </div>

          <div className="rounded-xl border p-6">
            Revenue Analytics
          </div>

        </div>
      </section>

      {/* COMING SOON */}
      <section className="bg-gradient-to-r from-blue-700 to-cyan-600 py-24 text-center text-white">
        <h2 className="text-4xl font-bold">
          Coming Soon
        </h2>

        <p className="mx-auto mt-4 max-w-2xl">
          Mobile Apps, Payment Gateway,
          Transportation Marketplace,
          OTA Marketplace and AI Travel Assistant.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-10 text-center text-white">

        <Image
          src="/images/logo.png"
          alt="MYTRIP Asia"
          width={70}
          height={70}
          className="mx-auto mb-4"
        />

        <h3 className="text-xl font-bold">
          MYTRIP Asia
        </h3>

        <p className="mt-2 text-slate-400">
          Travel Marketplace • Property Management System •
          Booking Engine • Hospitality Platform
        </p>

        <div className="mt-6 border-t border-slate-800 pt-6">
          <p>
            Copyright © 2026 MYTRIP Asia
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Developed by{" "}
            <a
              href="https://instagram.com/rendymandolang"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400"
            >
              Rendy Mandolang
            </a>
          </p>
        </div>

      </footer>
    </main>
  );
}
