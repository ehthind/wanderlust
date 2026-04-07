import Link from "next/link";

import { getDiscoverCardView } from "@wanderlust/domains/destinations";

const navItems = ["Discover", "Trips", "Search", "Inbox"] as const;

export default function HomePage() {
  const discover = getDiscoverCardView();

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: 820,
          borderRadius: 32,
          overflow: "hidden",
          position: "relative",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.66)), url('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80') center/cover",
          boxShadow: "0 32px 100px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>Wanderlust</span>
            <span>Discover</span>
          </div>

          <div style={{ marginTop: "auto", display: "grid", gap: 16 }}>
            <div
              style={{
                fontSize: 14,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {discover.destination.country}
            </div>
            <div style={{ fontSize: 56, lineHeight: 0.95 }}>{discover.destination.city}</div>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.4, maxWidth: 320 }}>
              {discover.destination.thesis}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {discover.chips.map((chip) => (
                <span
                  key={chip.label}
                  style={{
                    border: "1px solid var(--panel-border)",
                    background: "var(--panel)",
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                style={{
                  appearance: "none",
                  border: "1px solid var(--panel-border)",
                  background: "transparent",
                  color: "var(--text)",
                  borderRadius: 999,
                  padding: "14px 18px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
                type="button"
              >
                Save
              </button>
              <button
                style={{
                  appearance: "none",
                  border: 0,
                  background: "var(--accent)",
                  color: "#18130f",
                  borderRadius: 999,
                  padding: "14px 18px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
                type="button"
              >
                Plan Trip
              </button>
            </div>

            <div style={{ fontSize: 13, color: "var(--muted)" }}>{discover.cues.gestureHint}</div>
          </div>

          <nav
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              padding: 12,
              border: "1px solid var(--panel-border)",
              background: "rgba(6, 11, 21, 0.62)",
              borderRadius: 999,
              backdropFilter: "blur(18px)",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item}
                href={item === "Discover" ? "/" : "/discover"}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: item === "Discover" ? "var(--text)" : "var(--muted)",
                }}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
