import { AdminDashboard } from "@/pages/AdminDashboard";

// The reference design uses one shared "Repair queue" screen for both staff
// and admin — the backend already scopes /tickets to "everything" for both
// of those roles (only customers get auto-filtered to their own), so there's
// no data-shape difference to justify a separate component here. If admin
// needs extra controls later (e.g. reassigning technicians, editing SLA
// policy), that's the point to fork this back into its own file.
export function StaffDashboard() {
  return <AdminDashboard />;
}
