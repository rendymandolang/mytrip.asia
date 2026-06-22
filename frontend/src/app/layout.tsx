import type { Metadata } from "next";
import LanguageSelector from "@/components/LanguageSelector";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mytrip.asia"),

  title: {
    default: "MYTRIP Asia",
    template: "%s | MYTRIP Asia",
  },

  description:
    "Travel Marketplace, Property Management System, Booking Engine, Transportation and Hospitality Platform",

  openGraph: {
    title: "MYTRIP Asia",
    description:
      "Travel Marketplace, Property Management System, Booking Engine, Transportation and Hospitality Platform",
    url: "https://mytrip.asia",
    siteName: "MYTRIP Asia",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageSelector />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
