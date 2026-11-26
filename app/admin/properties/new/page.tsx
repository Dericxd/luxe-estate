import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/auth/verify-admin";
import { PropertyForm } from "../../../components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("luxe-auth-token")?.value;
  const check = await verifyAdmin(token);

  if (!check.ok) {
    if (check.reason === "no-token" || check.reason === "invalid-token") {
      redirect("/login?redirectTo=/admin/properties/new");
    }
    redirect("/");
  }

  return <PropertyForm mode="create" />;
}
