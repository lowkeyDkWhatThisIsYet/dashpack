import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthStore, getSession } from "@/lib/auth";
import { getEnabledProviders } from "@/lib/auth-providers";
import AuthForm from "../auth-form";

export const metadata = { title: "Sign in — Dashpack" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession(await headers())) redirect("/dashboard");
  if (!(await getAuthStore()).hasOwner())
    redirect((await searchParams).error ? "/signup?error=oauth" : "/signup");
  return (
    <AuthForm
      mode="login"
      providers={getEnabledProviders()}
      oauthError={Boolean((await searchParams).error)}
    />
  );
}
