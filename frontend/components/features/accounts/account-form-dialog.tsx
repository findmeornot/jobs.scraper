import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  accountSchema,
  editAccountSchema,
  type AccountFormData,
  type EditAccountFormData,
} from "@/schemas/account.schema";
import type { Account } from "@/types";

const TYPE_OPTIONS = [
  { value: true, label: "External" },
  { value: false, label: "Internal" },
] as const;

const STATUS_OPTIONS = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
] as const;

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AccountFormData) => Promise<boolean>;
  isPending: boolean;
}

export function AddAccountDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AddAccountDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { username: "", is_external: true },
  });

  const isExternal = watch("is_external");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function onValid(data: AccountFormData) {
    const ok = await onSubmit(data);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Instagram Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-medium text-foreground">
              Username
            </label>
            <Input
              id="username"
              autoFocus
              placeholder="e.g. company_account"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Type</label>
            <div className="flex gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setValue("is_external", opt.value)}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                    isExternal === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSubmit: (data: EditAccountFormData) => Promise<boolean>;
  isPending: boolean;
}

export function EditAccountDialog({
  open,
  onOpenChange,
  account,
  onSubmit,
  isPending,
}: EditAccountDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditAccountFormData>({
    resolver: zodResolver(editAccountSchema),
  });

  const isExternal = watch("is_external");
  const isActive = watch("is_active");

  useEffect(() => {
    if (account) {
      reset({
        username: account.username,
        is_external: Boolean(account.is_external),
        is_active: Boolean(account.is_active),
      });
    }
  }, [account, reset]);

  async function onValid(data: EditAccountFormData) {
    const ok = await onSubmit(data);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <Input autoFocus placeholder="username" {...register("username")} />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Type</label>
            <div className="flex gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setValue("is_external", opt.value)}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                    isExternal === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Status</label>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
