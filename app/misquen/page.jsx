// USER PAGE SERVER COMPONENT

import UserView from "@/components/misquen/userView";

export const metadata = {
  title: "Anggota | si-misquen",
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
    title: "Anggota | si-misquen",
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

export default function MisquenPage() {
  return <UserView />
}