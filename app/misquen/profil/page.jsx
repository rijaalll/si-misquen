// app/misquen/profil/page.jsx
// Halaman server untuk profil pengguna.

import { ProfileView } from "@/components";

export const metadata = {
  title: "Profil Pengguna | Si-Misquen",
  description: "Halaman untuk mengelola informasi profil pengguna.",
  keywords: ["koperasi", "profil", "pengaturan akun"],
  robots: {
    index: false, // Jangan index halaman profil di mesin pencari
    follow: false,
  },
  icons: {
    icon: "/webIcon.png",
  },
};

export default function ProfilePage() {
    return <ProfileView />;
}