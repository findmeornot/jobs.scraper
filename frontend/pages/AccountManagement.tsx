import { useState, useEffect } from "react";
import Modal from "../components/modal";
import StatusBadge from "../components/status-badge";

interface Account {
  id: number;
  username: string;
  instagram_id: string | null;
  followers: number;
  following: number;
  is_external: boolean;
  is_active: boolean;
  is_manual_input: boolean;
  created_at: string;
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "external" | "internal">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newIsExternal, setNewIsExternal] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    const query = filter === "all" ? "" : `?type=${filter === "external"}`;
    fetch(`/api/instagram/profile${query}`)
      .then((r) => r.json())
      .then((d) => setAccounts(d.results ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function addAccount() {
    if (!newUsername.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [newUsername.trim()] }),
      });
      if (!res.ok) throw new Error("Failed");
      setAddOpen(false);
      setNewUsername("");
      load();
    } catch {
      alert("Failed to add account");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = accounts.filter((a) =>
    a.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
          <p className="text-sm text-gray-500">Manage Instagram accounts</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
        >
          + Add Account
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="external">External</option>
          <option value="internal">Internal</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No accounts found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  Username
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  Instagram ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  Followers
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    @{account.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {account.instagram_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {account.followers?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        account.is_external
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {account.is_external ? "External" : "Internal"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        account.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={addOpen}
        title="Add Instagram Account"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addAccount}
              disabled={submitting || !newUsername.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700"
            >
              {submitting ? "Adding..." : "Add Account"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. company_account"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Type</label>
            <select
              value={newIsExternal ? "external" : "internal"}
              onChange={(e) => setNewIsExternal(e.target.value === "external")}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
