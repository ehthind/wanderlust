import { type AppEnv, loadAppEnv } from "@wanderlust/shared-config";

type Method = "GET" | "POST" | "PATCH";

const buildHeaders = (env: AppEnv, prefer?: string) => ({
  "Content-Type": "application/json",
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  ...(prefer ? { Prefer: prefer } : {}),
});

const buildUrl = (env: AppEnv, table: string, query?: URLSearchParams) => {
  const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);
  if (query) {
    url.search = query.toString();
  }
  return url;
};

export const createSupabaseAdminRequest = async ({
  table,
  method = "GET",
  query,
  body,
  prefer,
  env,
}: {
  table: string;
  method?: Method;
  query?: URLSearchParams;
  body?: unknown;
  prefer?: string;
  env?: AppEnv;
}) => {
  const resolvedEnv = env ?? (await loadAppEnv());
  const response = await fetch(buildUrl(resolvedEnv, table, query), {
    method,
    headers: buildHeaders(resolvedEnv, prefer),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${method} ${table} failed: ${response.status} ${detail}`.trim());
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as unknown;
};
