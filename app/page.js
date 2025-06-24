// LOGIN PAGE SERVER COMPONENT

import { LoginView } from "@/components";

export const metadata = {
  title: "Login | Si-Misquen",
  description: "Aplikasi koperasi untuk memudahkan pengelolaan anggota dan transaksi.",
  keywords: ["koperasi", "aplikasi koperasi", "pengelolaan anggota", "transaksi koperasi"],
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
  title: "Si-Misquen",
  description: "Aplikasi koperasi untuk memudahkan pengelolaan anggota dan transaksi.",
  images: "/webIcon.png",
  type: "website",
  siteName: "Si-Misquen",
  url: "https://koperasi-app.rpnza.my.id",
};

export default function LoginPage() {
  return <LoginView />
}