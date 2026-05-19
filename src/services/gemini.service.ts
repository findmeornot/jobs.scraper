import { geminiConfig } from "@/config/gemini";
import { findAllCategories, findCategoriesByIds } from "@/repositories/master-category.repo";
import type { GeminiJobData } from "@/types/index";

const DEFAULT_PROMPT = `RESPOND WITH ONLY A JSON OBJECT. NO OTHER TEXT.

Example response:
{"isJobPost":true,"title":"Sales Manager / Manajer Penjualan","company":"ABC Corp","email":"test@test.com","phone":"123456","area":"Jakarta","education":"S1","apply_url":"https://example.com/apply","min_age":20,"max_age":35,"soft_skills":["Communication","Leadership"],"hard_skills":["Microsoft Office","SQL"]}

Rules:
1. No markdown, no explanations, no formatting
2. Only valid JSON starting with { and ending with }
3. For company name: look for PT, CV, Group, Corp, Company, Ltd identifiers
4. For job titles: keep original language, use " / " separator for bilingual
5. For education: must be one of: SMP, SMA/SMK, D1/D2/D3, D4, S1, S2, S3, Umum
6. For area: extract any mentioned location or work area
7. For age requirements: extract min and max age if mentioned
8. For skills: separate soft skills (interpersonal) and hard skills (technical)
9. For apply URL: extract any application link

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
      caption ? `\n\nCaption: ${caption}` : ""
    }`;

    const raw = await callGeminiApi(imageUrl, prompt);
    const cleaned = cleanJsonResponse(raw);
    return await parseAndValidate(cleaned);
  } catch (error) {
    console.error("Gemini analysis error:", error);
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
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.response as string;
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim().replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
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
