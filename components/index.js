// components/index.js
// Mengelola ekspor komponen dari direktori components.

export { default as AdminDashboardView } from "./admin/DashboardView"; // Mengganti nama AdminView
export { default as UserManagementView } from "./admin/UserManagementView";
export { default as BungaTenorManagementView } from "./admin/BungaTenorManagementView";
export { default as SimpananManagementView } from "./admin/SimpananManagementView";
export { default as PinjamanManagementView } from "./admin/PinjamanManagementView";
export { default as LaporanKeuanganView } from "./admin/LaporanKeuanganView"; // Ekspor komponen baru

export { default as LoginView } from "./login/loginView";
export { default as UserView } from "./misquen/userView";
export { default as ProfileView } from "./misquen/ProfileView"; // Ekspor komponen profil baru
export { default as TellerView } from "./teller/tellerView";