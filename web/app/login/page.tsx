import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthStore, getSession } from "@/lib/auth";
import AuthForm from "../auth-form";

export const metadata = { title: "Sign in — Dashpack" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession(await headers())) redirect("/dashboard");
  if (!(await getAuthStore()).hasOwner()) redirect("/signup");
  return <AuthForm mode="login" />;
}
