import { useContext } from "react";
import { ConfirmContext, type ConfirmOptions } from "@/components/ui/confirm-dialog";

export type { ConfirmOptions };

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx.confirm;
}
