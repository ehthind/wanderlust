import { getDiscoverCardView } from "@wanderlust/domains/destinations";

export default function DiscoverPage() {
  const discover = getDiscoverCardView();

  return (
    <main style={{ padding: 40 }}>
      <h1>Discover</h1>
      <p>{discover.destination.thesis}</p>
    </main>
  );
}
