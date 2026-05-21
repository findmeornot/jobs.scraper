import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { Region, Province, Group, RegionAccount } from "@/types";
import type { RegionFormData, ProvinceFormData, GroupFormData } from "@/schemas/region.schema";

async function fetchAllRegionData() {
  const [regions, provinces, groups] = await Promise.all([
    apiFetch<{ results: Region[] }>("/api/master/region?details=true"),
    apiFetch<{ results: Province[] }>("/api/master/province"),
    apiFetch<{ results: Group[] }>("/api/master/group"),
  ]);
  return {
    regions: regions.results ?? [],
    provinces: provinces.results ?? [],
    groups: groups.results ?? [],
  };
}

async function fetchRegionAccounts(regionId: number): Promise<RegionAccount[]> {
  const data = await apiFetch<{ results: RegionAccount[] }>(
    `/api/master/region/${regionId}/accounts`,
  );
  return data.results ?? [];
}

export function useRegionData() {
  return useQuery({
    queryKey: ["region-data"],
    queryFn: fetchAllRegionData,
  });
}

export function useRegionAccounts(regionId: number | null) {
  return useQuery({
    queryKey: ["region-accounts", regionId],
    queryFn: () => fetchRegionAccounts(regionId!),
    enabled: regionId !== null,
  });
}

export function useSaveRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, editingId }: { data: RegionFormData; editingId?: number }) => {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/master/region/${editingId}` : "/api/master/region";
      return apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, { editingId }) => {
      toast.success(editingId ? "Region updated" : "Region created");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to save region"),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/master/region/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Region deleted");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to delete region"),
  });
}

export function useSaveProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, editingId }: { data: ProvinceFormData; editingId?: number }) => {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/master/province/${editingId}` : "/api/master/province";
      return apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, { editingId }) => {
      toast.success(editingId ? "Province updated" : "Province created");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to save province"),
  });
}

export function useDeleteProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/master/province/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Province deleted");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to delete province"),
  });
}

export function useSaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, editingId }: { data: GroupFormData; editingId?: number }) => {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/master/group/${editingId}` : "/api/master/group";
      return apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, { editingId }) => {
      toast.success(editingId ? "Group updated" : "Group created");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to save group"),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/master/group/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Group deleted");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to delete group"),
  });
}

export function useAddAccountToRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, accountId }: { regionId: number; accountId: number }) =>
      apiFetch(`/api/master/region/${regionId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      }),
    onSuccess: (_data, { regionId }) => {
      toast.success("Account assigned to region");
      qc.invalidateQueries({ queryKey: ["region-accounts", regionId] });
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to assign account"),
  });
}

export function useRemoveAccountFromRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, accountId }: { regionId: number; accountId: number }) =>
      apiFetch(`/api/master/region/${regionId}/accounts/${accountId}`, { method: "DELETE" }),
    onSuccess: (_data, { regionId }) => {
      toast.success("Account removed from region");
      qc.invalidateQueries({ queryKey: ["region-accounts", regionId] });
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to remove account"),
  });
}

export function useUpdateRegionGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      regionId,
      groupId,
      regions,
    }: {
      regionId: number;
      groupId: number | null;
      regions: Region[];
    }) => {
      const region = regions.find((r) => r.id === regionId);
      if (!region) throw new Error("Region not found");
      return apiFetch(`/api/master/region/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: region.name,
          province_id: region.province_id,
          group_id: groupId,
          js_loker: region.js_loker,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Region group updated");
      qc.invalidateQueries({ queryKey: ["region-data"] });
    },
    onError: () => toast.error("Failed to update region group"),
  });
}
