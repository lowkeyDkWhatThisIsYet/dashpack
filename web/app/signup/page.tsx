import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthStore, getSession } from "@/lib/auth";
import AuthForm from "../auth-form";

export const metadata = { title: "Create your workspace — Dashpack" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSession(await headers())) redirect("/dashboard");
  if ((await getAuthStore()).hasOwner()) redirect("/login");
  return <AuthForm mode="signup" />;
}
