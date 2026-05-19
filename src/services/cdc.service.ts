import { analyzeJobPoster } from "@/services/gemini.service";
import type { GeminiJobData } from "@/types/index";

export interface CdcPayload {
  key_kode: string;
  id_kab: number | null;
  id_prov: number | null;
  js_loker: string | null;
  kategori: string;
  nama: string | null;
  posisi: string | null;
  wa: string | null;
  email: string | null;
  link: string | null;
  pendidikan: string | null;
  min_umur: number | null;
  max_umur: number | null;
  soft: string | null;
  hard: string | null;
  disabilitas: number;
  size_img: number;
  img: string;
  link_img: string;
}

export async function buildCdcPayload(
  displayUrl: string,
  region: { id: number | null; province_id: number | null; js_loker: number | null } | null,
  caption?: string | null,
): Promise<{ payload: CdcPayload; jobData: GeminiJobData }> {
  const jobData = await analyzeJobPoster(displayUrl, caption ?? undefined);
  const imgName = `${crypto.randomUUID()}.jpg`;

  const payload: CdcPayload = {
    key_kode: process.env.CDC_KEY_CODE ?? "",
    id_kab: region?.id ?? null,
    id_prov: region?.province_id ?? null,
    js_loker: region?.js_loker?.toString() ?? null,
    kategori: jobData.category_ids?.join(",") ?? "5",
    nama: jobData.company,
    posisi: jobData.title,
    wa: jobData.phone,
    email: jobData.email,
    link: jobData.apply_url,
    pendidikan: jobData.education,
    min_umur: jobData.min_age,
    max_umur: jobData.max_age,
    soft: jobData.soft_skills?.join(",") ?? null,
    hard: jobData.hard_skills?.join(",") ?? null,
    disabilitas: 0,
    size_img: Math.floor(Math.random() * 500000),
    img: imgName,
    link_img: displayUrl,
  };

  return { payload, jobData };
}

export async function forwardToCdc(payload: CdcPayload): Promise<string> {
  const cdcUrl =
    process.env.CDC_API_URL ?? "https://cdc.stekom.ac.id/curl_loker/loker_masal_save";

  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value === null ? "" : String(value));
  }

  const response = await fetch(cdcUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`CDC forward failed: ${response.status}`);
  }

  return `https://cdc.stekom.ac.id/assets/loker/${payload.img}`;
}
