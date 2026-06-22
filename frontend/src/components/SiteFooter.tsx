import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="MYTRIP Asia"
              className="h-10 w-10 rounded"
            />
            <div>
              <div className="font-bold text-slate-900">
                MYTRIP Asia
              </div>
              <div className="text-xs text-slate-500">
                Travel, stay, lease, and manage
                properties.
              </div>
            </div>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            PMS, booking engine, property marketplace,
            partner operations, and OTA channel foundation
            for selected Asia destinations.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-900">
            Explore
          </h2>
          <div className="grid gap-2 text-sm">
            <Link href="/">Properties</Link>
            <Link href="/register">Buat Akun</Link>
            <Link href="/partner/register">
              Daftarkan Property Saya
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-900">
            Account
          </h2>
          <div className="grid gap-2 text-sm">
            <Link href="/login">Login</Link>
            <Link href="/partner/register">
              Partner Registration
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} MYTRIP Asia. All
        rights reserved.
      </div>
    </footer>
  );
}
