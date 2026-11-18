import { redirect } from "next/navigation";

/** /dashboard is the easy-to-remember address of the EXCO progress dashboard. */
export default function DashboardShortcut() {
  redirect("/admin/progress");
}
