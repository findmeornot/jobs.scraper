import { join } from "path";

export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return "";
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return "";
  }
}

export async function saveUploadedFile(file: File, dir: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const fullPath = join(process.cwd(), dir, filename);

  await Bun.write(fullPath, file);
  return filename;
}

export async function ensureDir(dir: string): Promise<void> {
  await Bun.$`mkdir -p ${dir}`.quiet();
}
