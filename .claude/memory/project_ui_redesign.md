---
name: project-ui-redesign
description: UI redesign completed — shadcn base-vega/@base-ui/react, hooks pattern, Lucide icons, toast+confirm system
metadata:
  type: project
---

UI fully redesigned (May 2026). Key architectural decisions:

**Why:** Hardcoded gray/blue colors, logic embedded in pages, emoji icons, alert()/confirm() calls needed cleanup.

**How to apply:** All future frontend work should follow these patterns:

1. **Colors**: Always use CSS variable classes (bg-card, text-foreground, border-border, text-muted-foreground) — never hardcode gray-* or blue-* Tailwind colors
2. **Data logic**: In hooks under `frontend/hooks/`. Pages are pure rendering. Each hook returns typed state + callbacks.
3. **UI components**: Use `@/components/ui/*`. Available: button, card, badge, input, select, table, dialog, toast, confirm-dialog
4. **Icons**: lucide-react only (no emoji). See dialog.tsx/layout.tsx for patterns.
5. **Feedback**: `toast.success/error/info()` from `@/components/ui/toast` (importable in hooks). For destructive confirms: `useConfirm()` from `@/components/ui/confirm-dialog`.
6. **Dialogs**: `Dialog + DialogContent + DialogHeader + DialogBody + DialogFooter + DialogTitle` — not the old modal pattern.
7. **@base-ui/react pattern**: Import as namespace e.g. `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"` then use `DialogPrimitive.Root`, `DialogPrimitive.Popup`, etc.

[[project_migration]]
