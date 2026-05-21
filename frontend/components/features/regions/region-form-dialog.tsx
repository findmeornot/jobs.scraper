import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  regionSchema,
  provinceSchema,
  groupSchema,
  type RegionFormData,
  type ProvinceFormData,
  type GroupFormData,
} from "@/schemas/region.schema";
import type { Region, Province, Group } from "@/types";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
] as const;

interface RegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Region;
  provinces: Province[];
  groups: Group[];
  onSubmit: (data: RegionFormData, editingId?: number) => Promise<boolean>;
  isPending: boolean;
}

export function RegionDialog({ open, onOpenChange, editing, provinces, groups, onSubmit, isPending }: RegionDialogProps) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
  });

  useEffect(() => {
    if (open && editing) {
      reset({
        name: editing.name,
        province_id: editing.province_id,
        group_id: editing.group_id,
        js_loker: editing.js_loker,
      });
    } else if (open && !editing) {
      reset({ name: "", province_id: undefined, group_id: null, js_loker: null });
    }
  }, [open, editing, reset]);

  async function onValid(data: RegionFormData) {
    const ok = await onSubmit(data, editing?.id);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Region" : "Add Region"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Region Name</label>
            <Input autoFocus placeholder="Enter region name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Province</label>
            <Controller
              control={control}
              name="province_id"
              render={({ field }) => (
                <Autocomplete
                  searchPlaceholder="Search provinces..."
                  placeholder="Select province..."
                  value={field.value ? String(field.value) : null}
                  onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  items={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
                />
              )}
            />
            {errors.province_id && <p className="text-xs text-destructive">{errors.province_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Group <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Controller
              control={control}
              name="group_id"
              render={({ field }) => (
                <Autocomplete
                  searchPlaceholder="Search groups..."
                  placeholder="No group"
                  value={field.value ? String(field.value) : null}
                  onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                  items={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                  clearable
                  clearLabel="No group"
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              JS Loker ID <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 123"
              {...register("js_loker", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProvinceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Province;
  onSubmit: (data: ProvinceFormData, editingId?: number) => Promise<boolean>;
  isPending: boolean;
}

export function ProvinceDialog({ open, onOpenChange, editing, onSubmit, isPending }: ProvinceDialogProps) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProvinceFormData>({
    resolver: zodResolver(provinceSchema),
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (open && editing) {
      reset({ name: editing.name, is_active: editing.is_active ? 1 : 0 });
    } else if (open && !editing) {
      reset({ name: "" });
    }
  }, [open, editing, reset]);

  async function onValid(data: ProvinceFormData) {
    const ok = await onSubmit(data, editing?.id);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Province" : "Add Province"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Province Name</label>
            <Input autoFocus placeholder="Enter province name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          {editing && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status</label>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("is_active", opt.value)}
                    className={cn(
                      "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                      isActive === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Group;
  onSubmit: (data: GroupFormData, editingId?: number) => Promise<boolean>;
  isPending: boolean;
}

export function GroupDialog({ open, onOpenChange, editing, onSubmit, isPending }: GroupDialogProps) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (open && editing) {
      reset({ name: editing.name, is_active: editing.is_active ? 1 : 0 });
    } else if (open && !editing) {
      reset({ name: "" });
    }
  }, [open, editing, reset]);

  async function onValid(data: GroupFormData) {
    const ok = await onSubmit(data, editing?.id);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Group" : "Add Group"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Group Name</label>
            <Input autoFocus placeholder="Enter group name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          {editing && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status</label>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("is_active", opt.value)}
                    className={cn(
                      "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                      isActive === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
