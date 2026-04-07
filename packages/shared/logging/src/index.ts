import { type AppLogEvent, formatLogEvent } from "@wanderlust/shared-observability";

const buildEvent = (
  level: AppLogEvent["level"],
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
): AppLogEvent => ({
  level,
  scope,
  message,
  ...(metadata ? { metadata } : {}),
});

export const createLogger = (scope: string) => ({
  info(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(`${formatLogEvent(buildEvent("info", scope, message, metadata))}\n`);
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(`${formatLogEvent(buildEvent("warn", scope, message, metadata))}\n`);
  },
  error(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(`${formatLogEvent(buildEvent("error", scope, message, metadata))}\n`);
  },
});
