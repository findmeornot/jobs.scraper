import { z } from "zod";

export const accountSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  is_external: z.boolean(),
});

export const editAccountSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  is_external: z.boolean(),
  is_active: z.boolean(),
});

export type AccountFormData = z.infer<typeof accountSchema>;
export type EditAccountFormData = z.infer<typeof editAccountSchema>;
