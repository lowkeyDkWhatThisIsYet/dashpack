export type AuthProvider = "google" | "github";

// Keep credentials on the server; pages receive only the configured provider names.
export function getSocialProviders(
  env: Record<string, string | undefined> = process.env,
) {
  return {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  };
}

export function getEnabledProviders(): AuthProvider[] {
  return Object.keys(getSocialProviders()) as AuthProvider[];
}
