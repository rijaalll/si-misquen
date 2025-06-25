import { PinjamanManagementView } from "@/components";

export const metadata = {
  title: "Pinjaman | Si-Misquen",
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

export default function SimpananManagementView() {
    return (
        <PinjamanManagementView />
    );
}