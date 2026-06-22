"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

const adminRoles = [
  "ADMIN",
  "SUPERADMIN",
  "FINANCE_HEAD",
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role === "OWNER") {
        router.replace("/owner");
        return;
      }

      if (!adminRoles.includes(user.role)) {
        router.replace("/");
        return;
      }

      setAllowed(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!allowed) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-500">
        Loading...
      </main>
    );
  }

  return children;
}
