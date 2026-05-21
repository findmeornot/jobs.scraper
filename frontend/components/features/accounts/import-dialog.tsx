import { useRef, useState } from "react";
import { read, utils } from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useImportAccounts } from "@/hooks/use-accounts";
import { importRowSchema, type ImportRow } from "@/schemas/import.schema";
import type { ImportResult } from "@/types";

type Phase =
  | { name: "guide" }
  | { name: "preview"; rows: ImportRow[]; skipped: number }
  | { name: "result"; result: ImportResult };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED = ".csv,.xlsx,.xls";
const EXAMPLE_CSV = `username,type\nloker_jakarta,external\nloker_bdg,internal`;

export function ImportDialog({ open, onOpenChange }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "guide" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const importAccounts = useImportAccounts();

  function reset() {
    setPhase({ name: "guide" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function handleFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0] ?? "";
    const sheet = wb.Sheets[sheetName];
    if (!sheet) { setPhase({ name: "preview", rows: [], skipped: 0 }); return; }
    const raw = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const rows: ImportRow[] = [];
    let skipped = 0;

    for (const r of raw) {
      const username = String(r["username"] ?? r["Username"] ?? "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
      const type = String(r["type"] ?? r["Type"] ?? "")
        .trim()
        .toLowerCase();

      const parsed = importRowSchema.safeParse({ username, type });
      if (parsed.success) {
        rows.push(parsed.data);
      } else {
        skipped++;
      }
    }

    setPhase({ name: "preview", rows, skipped });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files.item(0);
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (phase.name !== "preview") return;
    const result = await importAccounts.mutateAsync(phase.rows);
    setPhase({ name: "result", result });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Accounts</DialogTitle>
        </DialogHeader>

        {phase.name === "guide" && (
          <GuidePhase
            dragging={dragging}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onBrowse={() => inputRef.current?.click()}
          />
        )}

        {phase.name === "preview" && (
          <PreviewPhase rows={phase.rows} skipped={phase.skipped} />
        )}

        {phase.name === "result" && (
          <ResultPhase result={phase.result} />
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleInputChange}
        />

        <DialogFooter showCloseButton={phase.name !== "preview"}>
          {phase.name === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={phase.rows.length === 0 || importAccounts.isPending}
              >
                {importAccounts.isPending
                  ? "Importing…"
                  : `Import ${phase.rows.length} row${phase.rows.length !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuidePhase({
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
}: {
  dragging: boolean;
  onDragOver: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  onBrowse: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Format guide
        </p>
        <div className="overflow-hidden rounded border border-border text-xs font-mono">
          <div className="grid grid-cols-2 bg-muted px-3 py-2 font-semibold text-foreground">
            <span>username</span>
            <span>type</span>
          </div>
          <div className="divide-y divide-border">
            {[
              ["loker_jakarta", "external"],
              ["loker_bandung", "internal"],
            ].map(([u, t]) => (
              <div key={u} className="grid grid-cols-2 px-3 py-1.5 text-muted-foreground">
                <span>{u}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Accepted formats: <strong className="text-foreground">CSV</strong>, <strong className="text-foreground">Excel (.xlsx / .xls)</strong></li>
          <li>• <code className="rounded bg-muted px-1">type</code> must be <code className="rounded bg-muted px-1">external</code> or <code className="rounded bg-muted px-1">internal</code></li>
          <li>• Accounts that already exist are skipped automatically</li>
          <li>• Leading <code className="rounded bg-muted px-1">@</code> in usernames is stripped</li>
        </ul>
        <button
          onClick={() => {
            const blob = new Blob([EXAMPLE_CSV], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "accounts_template.csv";
            a.click();
          }}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Copy className="size-3" />
          Download template
        </button>
      </div>

      <button
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/40",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowse}
      >
        <FileSpreadsheet className="size-8 opacity-60" />
        <div>
          <p className="text-sm font-medium">Drop file here or click to browse</p>
          <p className="text-xs mt-0.5 opacity-70">CSV, XLSX or XLS</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs opacity-50">
          <Upload className="size-3" />
          Select file
        </div>
      </button>
    </div>
  );
}

function PreviewPhase({ rows, skipped }: { rows: ImportRow[]; skipped: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {rows.length} valid row{rows.length !== 1 ? "s" : ""} ready to import
          </p>
          {skipped > 0 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="size-3 text-orange-400" />
              {skipped} row{skipped !== 1 ? "s" : ""} skipped — missing or invalid fields
            </p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs font-mono">
          <div className="grid grid-cols-2 bg-muted px-3 py-2 font-semibold text-foreground sticky top-0">
            <span>username</span>
            <span>type</span>
          </div>
          <div className="divide-y divide-border">
            {rows.slice(0, 50).map((r, i) => (
              <div key={i} className="grid grid-cols-2 px-3 py-1.5 text-muted-foreground">
                <span>@{r.username}</span>
                <span>{r.type}</span>
              </div>
            ))}
            {rows.length > 50 && (
              <div className="px-3 py-2 text-center text-muted-foreground/60">
                +{rows.length - 50} more rows…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultPhase({ result }: { result: ImportResult }) {
  const stats = [
    {
      label: "Imported",
      value: result.imported,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Duplicates (skipped)",
      value: result.duplicates,
      icon: Copy,
      color: "text-muted-foreground",
    },
    {
      label: "Invalid (skipped)",
      value: result.invalid,
      icon: XCircle,
      color: "text-orange-400",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-4"
          >
            <Icon className={cn("size-5", color)} />
            <span className="text-2xl font-semibold tabular-nums">{value}</span>
            <span className="text-center text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Errors</p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive font-mono">
                {e}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
