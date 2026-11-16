import { test } from "node:test";
import assert from "node:assert/strict";
import { getSocialProviders } from "./auth-providers";

test("providers require both credentials and remain independent", () => {
  assert.deepEqual(getSocialProviders({}), {});
  assert.deepEqual(
    getSocialProviders({
      GOOGLE_CLIENT_ID: "incomplete",
      GITHUB_CLIENT_SECRET: "incomplete",
    }),
    {},
  );
  assert.deepEqual(
    getSocialProviders({
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
    }),
    {
      google: { clientId: "id", clientSecret: "secret" },
    },
  );
  assert.deepEqual(
    getSocialProviders({
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
    }),
    {
      github: { clientId: "id", clientSecret: "secret" },
    },
  );
});
