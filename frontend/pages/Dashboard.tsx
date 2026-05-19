import { useState, useEffect } from "react";
import StatCard from "../components/stat-card";

interface Stats {
  total_accounts: number;
  total_content: number;
  pending_content: number;
  confirmed_content: number;
  external_accounts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">{error}</div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">Overview of your Instagram scraper</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Accounts"
          value={stats?.total_accounts ?? 0}
          icon="👤"
          color="blue"
        />
        <StatCard
          label="External Accounts"
          value={stats?.external_accounts ?? 0}
          icon="🌐"
          color="purple"
        />
        <StatCard
          label="Pending Content"
          value={stats?.pending_content ?? 0}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmed_content ?? 0}
          icon="✅"
          color="green"
        />
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() =>
              fetch("/api/instagram/content/scrape", { method: "POST" })
                .then(() => alert("Scraping started!"))
                .catch(() => alert("Failed to start scraping"))
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ▶ Trigger Scrape
          </button>
        </div>
      </div>
    </div>
  );
}
