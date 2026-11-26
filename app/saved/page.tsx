import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { verifyUser } from "../lib/auth/verify-user";
import { getSavedPropertiesForUser } from "../lib/properties";
import { SavedPropertiesClient } from "./SavedPropertiesClient";

export const dynamic = "force-dynamic";

export default async function SavedPropertiesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("luxe-auth-token")?.value;
  const check = await verifyUser(token);

  if (!check.ok) {
    redirect("/login?redirectTo=/saved");
  }

  const savedProperties = await getSavedPropertiesForUser(token as string);

  return (
    <>
      <Navbar />
      <SavedPropertiesClient initialProperties={savedProperties} />
    </>
  );
}
