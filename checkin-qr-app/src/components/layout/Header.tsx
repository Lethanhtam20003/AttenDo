import { connection } from "next/server";
import { getUserSession } from "@/lib/supabase/server";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export default async function Header() {
  await connection();
  const user = await getUserSession();

  return (
    <MobileNavigation
      isAuthenticated={Boolean(user)}
      userEmail={user?.email ?? null}
    />
  );
}
