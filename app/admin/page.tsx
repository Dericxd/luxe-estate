import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllPropertiesForAdmin } from "../lib/properties";
import { verifyAdmin } from "../lib/auth/verify-admin";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("luxe-auth-token")?.value;
  const check = await verifyAdmin(token);

  if (!check.ok) {
    if (check.reason === "no-token" || check.reason === "invalid-token") {
      redirect("/login?redirectTo=/admin");
    }
    redirect("/");
  }

  const properties = await getAllPropertiesForAdmin(token as string);

  return <AdminDashboardClient initialProperties={properties} />;
}
