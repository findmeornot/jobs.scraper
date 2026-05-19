import { useState, useEffect } from "react";
import Modal from "../components/modal";

interface Province {
  id: number;
  name: string;
  is_active: boolean;
}

interface Group {
  id: number;
  name: string;
  is_active: boolean;
}

interface Region {
  id: number;
  name: string;
  province_id: number;
  group_id: number | null;
  js_loker: number | null;
  province_name: string;
  group_name: string | null;
  account_count: number;
}

interface RegionAccount {
  id: number;
  account_id: number;
  username: string;
  instagram_id: string | null;
  is_active: boolean;
}

type ActivePanel = "regions" | "provinces" | "groups";

export default function RegionManagement() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("regions");
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionAccounts, setRegionAccounts] = useState<RegionAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [regionModal, setRegionModal] = useState<{
    open: boolean;
    editing?: Region;
  }>({ open: false });
  const [provinceModal, setProvinceModal] = useState<{
    open: boolean;
    editing?: Province;
  }>({ open: false });
  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    editing?: Group;
  }>({ open: false });

  const [form, setForm] = useState<Record<string, string | number | null>>({});

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch("/api/master/region?details=true").then((r) => r.json()),
      fetch("/api/master/province").then((r) => r.json()),
      fetch("/api/master/group").then((r) => r.json()),
    ])
      .then(([r, p, g]) => {
        setRegions(r.results ?? []);
        setProvinces(p.results ?? []);
        setGroups(g.results ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  function openRegionAccounts(region: Region) {
    setSelectedRegion(region);
    setLoadingAccounts(true);
    fetch(`/api/master/region/${region.id}/accounts`)
      .then((r) => r.json())
      .then((d) => setRegionAccounts(d.results ?? []))
      .finally(() => setLoadingAccounts(false));
  }

  async function saveRegion() {
    const method = regionModal.editing ? "PUT" : "POST";
    const url = regionModal.editing
      ? `/api/master/region/${regionModal.editing.id}`
      : "/api/master/region";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setRegionModal({ open: false });
    loadAll();
  }

  async function deleteRegion(id: number) {
    if (!confirm("Delete this region?")) return;
    await fetch(`/api/master/region/${id}`, { method: "DELETE" });
    if (selectedRegion?.id === id) setSelectedRegion(null);
    loadAll();
  }

  async function saveProvince() {
    const method = provinceModal.editing ? "PUT" : "POST";
    const url = provinceModal.editing
      ? `/api/master/province/${provinceModal.editing.id}`
      : "/api/master/province";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setProvinceModal({ open: false });
    loadAll();
  }

  async function saveGroup() {
    const method = groupModal.editing ? "PUT" : "POST";
    const url = groupModal.editing
      ? `/api/master/group/${groupModal.editing.id}`
      : "/api/master/group";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setGroupModal({ open: false });
    loadAll();
  }

  async function removeAccountFromRegion(accountId: number) {
    if (!selectedRegion) return;
    await fetch(
      `/api/master/region/${selectedRegion.id}/accounts/${accountId}`,
      {
        method: "DELETE",
      },
    );
    setRegionAccounts((prev) => prev.filter((a) => a.account_id !== accountId));
  }

  const TABS: { id: ActivePanel; label: string }[] = [
    { id: "regions", label: "Regions" },
    { id: "provinces", label: "Provinces" },
    { id: "groups", label: "Groups" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Region Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage provinces, groups, and regions
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activePanel === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : (
        <>
          {activePanel === "regions" && (
            <div className="flex gap-4">
              <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">
                    Regions ({regions.length})
                  </span>
                  <button
                    onClick={() => {
                      setForm({});
                      setRegionModal({ open: true });
                    }}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      onClick={() => openRegionAccounts(region)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRegion?.id === region.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {region.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {region.province_name}
                            {region.group_name ? ` · ${region.group_name}` : ""}
                            {" · "}
                            <span className="text-blue-500">
                              {region.account_count} accounts
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({
                                name: region.name,
                                province_id: region.province_id,
                                group_id: region.group_id ?? "",
                                js_loker: region.js_loker ?? "",
                              });
                              setRegionModal({ open: true, editing: region });
                            }}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRegion(region.id);
                            }}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRegion && (
                <div className="w-72 bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      @{selectedRegion.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Assigned accounts
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                    {loadingAccounts ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        Loading...
                      </div>
                    ) : regionAccounts.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        No accounts assigned
                      </div>
                    ) : (
                      regionAccounts.map((ra) => (
                        <div
                          key={ra.id}
                          className="px-4 py-2.5 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              @{ra.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ra.instagram_id ?? "no ID"}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              removeAccountFromRegion(ra.account_id)
                            }
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === "provinces" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  Provinces ({provinces.length})
                </span>
                <button
                  onClick={() => {
                    setForm({});
                    setProvinceModal({ open: true });
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {provinces.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-900">{p.name}</p>
                      <span
                        className={`text-xs ${p.is_active ? "text-green-600" : "text-gray-400"}`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setForm({
                            name: p.name,
                            is_active: p.is_active ? 1 : 0,
                          });
                          setProvinceModal({ open: true, editing: p });
                        }}
                        className="text-xs text-gray-500 hover:text-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePanel === "groups" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  Groups ({groups.length})
                </span>
                <button
                  onClick={() => {
                    setForm({});
                    setGroupModal({ open: true });
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-900">{g.name}</p>
                      <span
                        className={`text-xs ${g.is_active ? "text-green-600" : "text-gray-400"}`}
                      >
                        {g.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setForm({
                            name: g.name,
                            is_active: g.is_active ? 1 : 0,
                          });
                          setGroupModal({ open: true, editing: g });
                        }}
                        className="text-xs text-gray-500 hover:text-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={regionModal.open}
        title={regionModal.editing ? "Edit Region" : "Add Region"}
        onClose={() => setRegionModal({ open: false })}
        footer={
          <>
            <button
              onClick={() => setRegionModal({ open: false })}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveRegion}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">
              Region Name
            </label>
            <input
              type="text"
              value={String(form.name ?? "")}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              Province
            </label>
            <select
              value={String(form.province_id ?? "")}
              onChange={(e) =>
                setForm({ ...form, province_id: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select province...</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              Group (optional)
            </label>
            <select
              value={String(form.group_id ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  group_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              JS Loker ID (optional)
            </label>
            <input
              type="number"
              value={String(form.js_loker ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  js_loker: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={provinceModal.open}
        title={provinceModal.editing ? "Edit Province" : "Add Province"}
        onClose={() => setProvinceModal({ open: false })}
        footer={
          <>
            <button
              onClick={() => setProvinceModal({ open: false })}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveProvince}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">
              Province Name
            </label>
            <input
              type="text"
              value={String(form.name ?? "")}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {provinceModal.editing && (
            <div>
              <label className="text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={String(form.is_active ?? 1)}
                onChange={(e) =>
                  setForm({ ...form, is_active: Number(e.target.value) })
                }
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={groupModal.open}
        title={groupModal.editing ? "Edit Group" : "Add Group"}
        onClose={() => setGroupModal({ open: false })}
        footer={
          <>
            <button
              onClick={() => setGroupModal({ open: false })}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveGroup}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              value={String(form.name ?? "")}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {groupModal.editing && (
            <div>
              <label className="text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={String(form.is_active ?? 1)}
                onChange={(e) =>
                  setForm({ ...form, is_active: Number(e.target.value) })
                }
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
