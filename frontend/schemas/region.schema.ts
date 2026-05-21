import { z } from "zod";

export const regionSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  province_id: z.number({ message: "Province is required" }).int().positive("Province is required"),
  group_id: z.number().int().positive().nullable().optional(),
  js_loker: z.number().int().positive().nullable().optional(),
});

export const provinceSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export type RegionFormData = z.infer<typeof regionSchema>;
export type ProvinceFormData = z.infer<typeof provinceSchema>;
export type GroupFormData = z.infer<typeof groupSchema>;
