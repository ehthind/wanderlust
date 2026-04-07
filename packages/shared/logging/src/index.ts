import {
  type AppLogEvent,
  buildTraceContext,
  formatLogEvent,
} from "@wanderlust/shared-observability";

const buildEvent = (
  level: AppLogEvent["level"],
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
  options?: { includeTrace?: boolean },
): AppLogEvent => ({
  level,
  scope,
  message,
  ...(options?.includeTrace ? { trace: buildTraceContext(scope) } : {}),
  ...(metadata ? { metadata } : {}),
});

export const createLogger = (scope: string, options?: { includeTrace?: boolean }) => ({
  debug(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(
      `${formatLogEvent(buildEvent("debug", scope, message, metadata, options))}\n`,
    );
  },
  info(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(
      `${formatLogEvent(buildEvent("info", scope, message, metadata, options))}\n`,
    );
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(
      `${formatLogEvent(buildEvent("warn", scope, message, metadata, options))}\n`,
    );
  },
  error(message: string, metadata?: Record<string, unknown>) {
    process.stdout.write(
      `${formatLogEvent(buildEvent("error", scope, message, metadata, options))}\n`,
    );
  },
});
