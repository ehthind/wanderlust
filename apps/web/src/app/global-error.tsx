"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            background: "linear-gradient(180deg, rgba(245,244,238,1) 0%, rgba(234,228,214,1) 100%)",
            color: "#221f17",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              border: "1px solid rgba(34,31,23,0.14)",
              borderRadius: "1.5rem",
              background: "rgba(255,255,255,0.78)",
              padding: "2rem",
              boxShadow: "0 24px 70px rgba(70,53,23,0.12)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Wanderlust
            </p>
            <h1
              style={{
                marginTop: "0.75rem",
                marginBottom: "0.75rem",
                fontSize: "2rem",
                lineHeight: 1.1,
              }}
            >
              Something went wrong.
            </h1>
            <p
              style={{
                marginTop: 0,
                marginBottom: "1.5rem",
                lineHeight: 1.6,
                opacity: 0.75,
              }}
            >
              The error has been recorded. Try the request again, or reload if the problem persists.
            </p>
            <button
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "999px",
                padding: "0.9rem 1.4rem",
                background: "#1f5d52",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
