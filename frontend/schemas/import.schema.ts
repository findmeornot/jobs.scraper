import { z } from "zod";

export const ACCOUNT_TYPES = ["external", "internal"] as const;

export const importRowSchema = z.object({
  username: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
});

export type ImportRow = z.infer<typeof importRowSchema>;
