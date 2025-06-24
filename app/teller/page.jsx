// TELLER PAGE SERVER COMPONENT

import TellerView from "@/components/teller/tellerView";

export const metadata = {
  title: "Teller | Si-Misquen",
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
  openGraph: {
    title: "Teller | Si-Misquen",
    description: "Aplikasi koperasi untuk memudahkan pengelolaan anggota dan transaksi.",
    url: "https://koperasi-app.example.com",
    type: "website",
    siteName: "Koperasi App",
    images: [
      {
        url: "/webIcon.png",
        alt: "Koperasi App",
      },
    ],
  },
};

export default function TellerPage() {
  return <TellerView />
}