import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return email.toLowerCase();
}
