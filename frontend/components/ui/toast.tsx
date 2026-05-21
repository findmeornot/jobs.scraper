import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const toastManager = Toast.createToastManager<{
  type?: "success" | "error" | "info";
}>();

export const toast = {
  success: (title: string, description?: string) =>
    toastManager.add({
      title,
      description,
      data: { type: "success" },
      timeout: 4000,
    }),
  error: (title: string, description?: string) =>
    toastManager.add({
      title,
      description,
      data: { type: "error" },
      timeout: 6000,
    }),
  info: (title: string, description?: string) =>
    toastManager.add({
      title,
      description,
      data: { type: "info" },
      timeout: 4000,
    }),
};

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const ICON_CLASS_MAP = {
  success: "text-green-600 dark:text-green-400",
  error: "text-destructive",
  info: "text-primary",
} as const;

type ToastData = { type?: "success" | "error" | "info" };

function ToastItem({ t }: { t: Toast.Root.ToastObject<ToastData> }) {
  const type = t.data?.type ?? "info";
  const Icon = ICON_MAP[type];
  const iconClass = ICON_CLASS_MAP[type];

  return (
    <Toast.Root
      toast={t}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl bg-card p-4 shadow-lg ring-1 ring-foreground/10",
        "transition-all duration-200",
        "data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0",
        "data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} aria-hidden />
      <div className="flex-1 space-y-0.5">
        {t.title && (
          <Toast.Title className="text-sm font-medium text-foreground">{t.title}</Toast.Title>
        )}
        {t.description && (
          <Toast.Description className="text-xs text-muted-foreground">
            {t.description}
          </Toast.Description>
        )}
      </div>
      <Toast.Close
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          />
        }
      >
        <X className="size-3.5" aria-hidden />
      </Toast.Close>
    </Toast.Root>
  );
}

function ToastViewportInner() {
  const { toasts } = Toast.useToastManager<ToastData>();
  return (
    <Toast.Viewport className="fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col-reverse gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </Toast.Viewport>
  );
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastViewportInner />
    </Toast.Provider>
  );
}
