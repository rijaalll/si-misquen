// app/admin/page.jsx
// Halaman server untuk dashboard admin utama.

import { AdminDashboardView } from "@/components";

export const metadata = {
  title: "Dashboard Admin | Si-Misquen",
  description: "Dashboard utama untuk pengelolaan aplikasi koperasi oleh admin.",
  keywords: ["koperasi", "aplikasi koperasi", "admin", "dashboard"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/webIcon.png",
  },
};

export const openGraph = {
  title: "Dashboard Admin Si-Misquen",
  description: "Dashboard utama untuk pengelolaan aplikasi koperasi oleh admin.",
  images: "/webIcon.png",
  type: "website",
  siteName: "Si-Misquen",
  url: "https://koperasi-app.rpnza.my.id",
};

export default function AdminPage() {
    return <AdminDashboardView />; // Menggunakan komponen DashboardView yang baru
}
