import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifyAdmin } from "../../../../lib/auth/verify-admin";
import { getRawPropertyByIdForAdmin } from "../../../../lib/properties";
import { PropertyForm } from "../../../../components/admin/PropertyForm";

export const dynamic = "force-dynamic";

interface EditPropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("luxe-auth-token")?.value;
  const check = await verifyAdmin(token);

  if (!check.ok) {
    if (check.reason === "no-token" || check.reason === "invalid-token") {
      redirect(`/login?redirectTo=/admin/properties/${encodeURIComponent(id)}/edit`);
    }
    redirect("/");
  }

  const property = await getRawPropertyByIdForAdmin(id);

  if (!property) {
    notFound();
  }

  return <PropertyForm mode="edit" initialProperty={property} />;
}
