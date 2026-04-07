export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type AppLogEvent = {
  level: AppLogLevel;
  message: string;
  scope: string;
  metadata?: Record<string, unknown>;
};

export const formatLogEvent = (event: AppLogEvent): string =>
  JSON.stringify({
    ts: new Date().toISOString(),
    ...event,
  });
