import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { uploadToS3 } from "@/lib/storage/s3";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function storeLearningFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const safeName = sanitizeFilename(originalName);
  const key = `learning/files/${randomUUID()}-${safeName}`;

  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    await uploadToS3(key, buffer, contentType);
    const region = process.env.AWS_REGION ?? "us-east-1";
    const bucket = process.env.AWS_S3_BUCKET;
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  const dir = path.join(process.cwd(), "public", "learning", "files");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/learning/files/${filename}`;
}
