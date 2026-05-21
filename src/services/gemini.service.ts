import { geminiConfig } from "@/config/gemini";
import { logger } from "@/utils/logger";
import { findAllCategories, findCategoriesByIds } from "@/repositories/master-category.repo";
import type { GeminiJobData } from "@/types/index";

const DEFAULT_PROMPT = `RESPOND WITH ONLY A JSON OBJECT. NO OTHER TEXT.

Example response:
{"isJobPost":true,"title":"Sales Manager / Manajer Penjualan","company":"ABC Corp","email":"test@test.com","phone":"123456","area":"Jakarta","education":"S1","apply_url":"https://example.com/apply","min_age":20,"max_age":35,"soft_skills":["Communication","Leadership"],"hard_skills":["Microsoft Office","SQL"]}

Rules:
1. No markdown, no explanations, no formatting
2. Only valid JSON starting with { and ending with }
3. Assume isJobPost = true unless the image/caption is CLEARLY unrelated to job recruitment (e.g. food, travel, fashion, memes). Indonesian job posts often use terms like "loker", "lowongan", "dibutuhkan", "rekrutmen", "hiring", "posisi", "pelamar", "kualifikasi"
4. For company name: look for PT, CV, Group, Corp, Tbk, UD, or any business name. Use the brand/company visible in the image if not in caption
5. For job titles: keep original language, use " / " separator for bilingual
6. For education: must be one of: SMP, SMA/SMK, D1/D2/D3, D4, S1, S2, S3, Umum
7. For area: extract any mentioned location, city, or work area
8. For age requirements: extract min and max age if mentioned
9. For skills: separate soft skills (interpersonal) and hard skills (technical/certification)
10. For apply URL: extract any application link, wa.me link, or email

Now analyze the image and caption to output the JSON.`;

const DEFAULT_RESPONSE: GeminiJobData = {
  isJobPost: false,
  title: null,
  company: null,
  email: null,
  phone: null,
  area: null,
  education: null,
  apply_url: null,
  min_age: null,
  max_age: null,
  soft_skills: null,
  hard_skills: null,
  category_ids: null,
};

const VALID_EDUCATION = ["SMP", "SMA/SMK", "D1/D2/D3", "D4", "S1", "S2", "S3", "Umum"] as const;

export async function analyzeJobPoster(
  imageUrl: string,
  caption?: string,
): Promise<GeminiJobData> {
  try {
    const categories = await findAllCategories();
    const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");

    const prompt = `${DEFAULT_PROMPT}\n\nAvailable categories (respond with category_ids as array of numbers):\n${categoryList}${
      caption ? `\n\nAdditional context from image caption: ${caption}` : ""
    }`;

    const raw = await callGeminiApi(imageUrl, prompt);

    let cleaned = cleanJsonResponse(raw);

    if (!cleaned.startsWith("{")) {
      cleaned = createFallbackResponse(raw);
    }

    const result = await parseAndValidate(cleaned);

    return result;
  } catch (error) {
    logger.error({ error }, "[Gemini] analysis failed");
    return DEFAULT_RESPONSE;
  }
}

async function callGeminiApi(imageUrl: string, prompt: string): Promise<string> {
  const response = await fetch(`${geminiConfig.baseUrl}${geminiConfig.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": geminiConfig.headers["x-api-key"],
      "x-origin": geminiConfig.headers["x-origin"],
    },
    body: JSON.stringify({ prompt, image_url: imageUrl }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Gemini API ${response.status}: ${body}`);
  }

  const data = await response.json();
  if (!data.response) throw new Error(`Gemini returned empty response: ${JSON.stringify(data)}`);
  return data.response as string;
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim().replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  // Strip any trailing non-JSON garbage after the closing brace
  cleaned = cleaned.replace(/[^}]+$/, "");
  return cleaned;
}

function createFallbackResponse(text: string): string {
  // Phone: must contain actual digits (min 6)
  const phoneRaw = text.match(/(?:Phone|WhatsApp|WA|Telp|HP)\s*:?\s*([\d\s\-+()\[\]]{6,})/i)?.[1]?.trim() ?? null;
  const phone = phoneRaw && /\d{5,}/.test(phoneRaw) ? phoneRaw : null;

  const education = text.match(
    /(?:Pendidikan|Education|Lulusan)\s*:?\s*((?:S\d|D\d|SMA|SMK|SMP|Bachelor|Master|PhD)[^,\n]{0,30})/i,
  )?.[1]?.trim() ?? null;

  // Area: require at least a city/word after the keyword, not just "Kerja:"
  const areaRaw = text.match(
    /(?:Lokasi|Wilayah|Domisili|Penempatan\s+Kerja|Location)\s*:?\s*([A-Za-z][^,\n]{2,40})/i,
  )?.[1]?.trim() ?? null;
  const area = areaRaw && !areaRaw.toLowerCase().startsWith("kerja") ? areaRaw : null;

  return JSON.stringify({
    ...DEFAULT_RESPONSE,
    isJobPost: !!(phone || education || area),
    phone,
    education,
    area,
  });
}

async function parseAndValidate(text: string): Promise<GeminiJobData> {
  try {
    if (!text.startsWith("{")) return DEFAULT_RESPONSE;

    const parsed = JSON.parse(text);
    let validCategoryIds = parsed.category_ids as number[] | null;

    if (Array.isArray(validCategoryIds) && validCategoryIds.length > 0) {
      const valid = await findCategoriesByIds(validCategoryIds);
      if (valid.length !== validCategoryIds.length) validCategoryIds = null;
    }

    return {
      isJobPost: Boolean(parsed.isJobPost),
      title: validateString(parsed.title),
      company: validateString(parsed.company),
      email: validateString(parsed.email),
      phone: validateString(parsed.phone),
      area: validateString(parsed.area),
      education: validateEducation(parsed.education),
      apply_url: validateString(parsed.apply_url),
      min_age: validateNumber(parsed.min_age),
      max_age: validateNumber(parsed.max_age),
      soft_skills: validateArray(parsed.soft_skills),
      hard_skills: validateArray(parsed.hard_skills),
      category_ids: Array.isArray(validCategoryIds) ? validCategoryIds : null,
    };
  } catch {
    return DEFAULT_RESPONSE;
  }
}

function validateString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function validateNumber(v: unknown): number | null {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

function validateArray(v: unknown): string[] | null {
  return Array.isArray(v) && v.length > 0 ? v : null;
}

function validateEducation(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const upper = v.trim().toUpperCase();
  return VALID_EDUCATION.find((e) => upper.includes(e.toUpperCase())) ?? null;
}
