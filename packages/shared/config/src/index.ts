import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("Wanderlust"),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  SUPABASE_URL: z
    .string()
    .url()
    .or(z.string().startsWith("http://127.0.0.1"))
    .default("http://127.0.0.1:54321"),
  SUPABASE_ANON_KEY: z.string().default("local-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("local-service-role-key"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const getAppEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv =>
  envSchema.parse(source);
