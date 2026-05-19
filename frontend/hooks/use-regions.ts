import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";

export interface Province {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Group {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Region {
  id: number;
  name: string;
  province_id: number;
  group_id: number | null;
  js_loker: number | null;
  province_name: string;
  group_name: string | null;
  account_count: number;
}

export interface RegionAccount {
  id: number;
  account_id: number;
  username: string;
  instagram_id: string | null;
  is_active: boolean;
}

export interface RegionFormData {
  name: string;
  province_id: number;
  group_id?: number | null;
  js_loker?: number | null;
}

export interface ProvinceFormData {
  name: string;
  is_active?: number;
}

export interface GroupFormData {
  name: string;
  is_active?: number;
}

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionAccounts, setRegionAccounts] = useState<RegionAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
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
      .catch(() => toast.error("Failed to load region data"))
      .finally(() => setLoading(false));
  }, [tick]);

  function fetchRegionAccounts(regionId: number) {
    setLoadingAccounts(true);
    fetch(`/api/master/region/${regionId}/accounts`)
      .then((r) => r.json())
      .then((d) => setRegionAccounts(d.results ?? []))
      .catch(() => toast.error("Failed to load region accounts"))
      .finally(() => setLoadingAccounts(false));
  }

  function selectRegion(region: Region) {
    setSelectedRegion(region);
    fetchRegionAccounts(region.id);
  }

  async function addAccountToRegion(regionId: number, accountId: number): Promise<boolean> {
    try {
      const r = await fetch(`/api/master/region/${regionId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });
      if (!r.ok) throw new Error();
      fetchRegionAccounts(regionId);
      // Update account_count in regions list optimistically
      setRegions((prev) =>
        prev.map((reg) =>
          reg.id === regionId
            ? { ...reg, account_count: reg.account_count + 1 }
            : reg,
        ),
      );
      toast.success("Account assigned to region");
      return true;
    } catch {
      toast.error("Failed to assign account");
      return false;
    }
  }

  async function removeAccountFromRegion(regionId: number, accountId: number): Promise<void> {
    try {
      await fetch(`/api/master/region/${regionId}/accounts/${accountId}`, {
        method: "DELETE",
      });
      setRegionAccounts((prev) => prev.filter((a) => a.account_id !== accountId));
      setRegions((prev) =>
        prev.map((reg) =>
          reg.id === regionId
            ? { ...reg, account_count: Math.max(0, reg.account_count - 1) }
            : reg,
        ),
      );
      toast.success("Account removed from region");
    } catch {
      toast.error("Failed to remove account");
    }
  }

  async function updateRegionGroup(regionId: number, groupId: number | null): Promise<boolean> {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return false;
    return saveRegion(
      { name: region.name, province_id: region.province_id, group_id: groupId, js_loker: region.js_loker },
      regionId,
    );
  }

  async function saveRegion(data: RegionFormData, editingId?: number): Promise<boolean> {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/master/region/${editingId}` : "/api/master/region";
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      toast.success(editingId ? "Region updated" : "Region created");
      refetch();
      return true;
    } catch {
      toast.error("Failed to save region");
      return false;
    }
  }

  async function deleteRegion(id: number): Promise<void> {
    try {
      await fetch(`/api/master/region/${id}`, { method: "DELETE" });
      if (selectedRegion?.id === id) setSelectedRegion(null);
      toast.success("Region deleted");
      refetch();
    } catch {
      toast.error("Failed to delete region");
    }
  }

  async function saveProvince(data: ProvinceFormData, editingId?: number): Promise<boolean> {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/master/province/${editingId}` : "/api/master/province";
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      toast.success(editingId ? "Province updated" : "Province created");
      refetch();
      return true;
    } catch {
      toast.error("Failed to save province");
      return false;
    }
  }

  async function deleteProvince(id: number): Promise<void> {
    try {
      await fetch(`/api/master/province/${id}`, { method: "DELETE" });
      toast.success("Province deleted");
      refetch();
    } catch {
      toast.error("Failed to delete province");
    }
  }

  async function saveGroup(data: GroupFormData, editingId?: number): Promise<boolean> {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/master/group/${editingId}` : "/api/master/group";
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      toast.success(editingId ? "Group updated" : "Group created");
      refetch();
      return true;
    } catch {
      toast.error("Failed to save group");
      return false;
    }
  }

  async function deleteGroup(id: number): Promise<void> {
    try {
      await fetch(`/api/master/group/${id}`, { method: "DELETE" });
      toast.success("Group deleted");
      refetch();
    } catch {
      toast.error("Failed to delete group");
    }
  }

  return {
    regions,
    provinces,
    groups,
    loading,
    selectedRegion,
    selectRegion,
    regionAccounts,
    loadingAccounts,
    addAccountToRegion,
    removeAccountFromRegion,
    updateRegionGroup,
    saveRegion,
    deleteRegion,
    saveProvince,
    deleteProvince,
    saveGroup,
    deleteGroup,
    refetch,
  };
}
