import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  return (
    <Dashboard user={{ name: session.user.name, email: session.user.email }} />
  );
}
